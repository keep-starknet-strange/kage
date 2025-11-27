import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { base64ToBytes, bytesToBase64, bytesToString, stringToBytes } from "@/crypto/utils/encoding";
import { randomBytes } from "@/crypto/utils/Random";
import { KeySourceId } from "@/profile/keys/keySource";
import EncryptedStorage, { AuthPrompt } from "@/storage/encrypted/EncryptedStorage";
import { AppError } from "@/types/appError";
import SeedPhraseWords from "@/types/seedPhraseWords";
import i18n from "@/utils/i18n";

const SALT_KEY = "salt";
const ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY = "encrypted_seed_phrase_encryption_key";
const KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY = "keychain_seed_phrase_encryption_key";

// TODO define errors instead of bools
export default class SeedPhraseVault {

    constructor(
        private readonly encryptedStorage: EncryptedStorage,
        private readonly cryptoProvider: CryptoProvider,
    ) { }

    async setup(passphrase: string, seedPhrase: SeedPhraseWords): Promise<void> {
        const passphraseBytes = stringToBytes(passphrase);
        const salt = randomBytes(32);

        const keyUser = await this.cryptoProvider.deriveKey(passphraseBytes, salt);
        const seedEncryptionKey = randomBytes(32);
        const seedPhraseBytes = stringToBytes(seedPhrase.toString());

        const encryptedSeedPhrase = await this.cryptoProvider.encrypt(seedPhraseBytes, seedEncryptionKey);
        const encryptedSeedEncryptionKey = await this.cryptoProvider.encrypt(seedEncryptionKey, keyUser);

        const keySourceId = KeySourceId.from(seedPhrase);
        const saltSaved = await this.encryptedStorage.setItem(
            SALT_KEY,
            bytesToBase64(salt)
        );
        if (!saltSaved) {
            throw new AppError(i18n.t('errors.failedToStoreSalt'), keySourceId);
        }

        const encryptedSeedPhraseKeyUserSaved = await this.encryptedStorage.setItem(
            ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY,
            bytesToBase64(encryptedSeedEncryptionKey)
        );
        if (!encryptedSeedPhraseKeyUserSaved) {
            throw new AppError(i18n.t('errors.failedToStoreEncryptedKey'), keySourceId);
        }

        const encryptedSeedPhraseSaved = this.encryptedStorage.setItem(
            this.encryptedSeedPhraseIdentifier(keySourceId),
            bytesToBase64(encryptedSeedPhrase)
        );
        if (!encryptedSeedPhraseSaved) { 
            throw new AppError(i18n.t('errors.failedToStoreEncryptedSeedPhrase'), keySourceId);
        }
    }

    async enableBiometrics(passphrase: string, prompt: AuthPrompt): Promise<void> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            throw new AppError(i18n.t('errors.saltNotFound'));
        }
        const salt = base64ToBytes(saltBase64);
        const keyUser = await this.cryptoProvider.deriveKey(stringToBytes(passphrase), salt);

        const encryptedSeedPhraseEncryptionKeyBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY);
        if (!encryptedSeedPhraseEncryptionKeyBase64) {
            throw new AppError(i18n.t('errors.encryptedKeyNotFound'));
        }
        const encryptedSeedPhraseEncryptionKey = base64ToBytes(encryptedSeedPhraseEncryptionKeyBase64);
        const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseEncryptionKey, keyUser);
        const stored = await this.encryptedStorage.setItem(
            KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY,
            bytesToBase64(seedEncryptionKey),
            prompt
        );
        if (!stored) {
            throw new AppError(i18n.t('errors.failedToStoreSeedEncryptionKey'));
        }
    }

    async disableBiometrics(): Promise<void> {
        await this.encryptedStorage.removeItem(KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY);
    }

    async getSeedPhrasesWithPassphrase(passphrase: string, keySourceIds: KeySourceId[]): Promise<Map<KeySourceId, SeedPhraseWords>> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            throw new AppError(`${SALT_KEY} not found in encrypted storage`);
        }
        const salt = base64ToBytes(saltBase64);

        const encryptedSeedPhraseEncryptionKeyBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY)
        if (!encryptedSeedPhraseEncryptionKeyBase64) {
            throw new AppError(`${ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY} not found in keychain`);
        }
        const encryptedSeedPhraseEncryptionKey = base64ToBytes(encryptedSeedPhraseEncryptionKeyBase64);

        const result = new Map<KeySourceId, SeedPhraseWords>();
        for (const keySourceId of keySourceIds) {
            const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
            if (!encryptedSeedPhraseBase64) {
                throw new AppError(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
            }
            const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);

            const keyUser = await this.cryptoProvider.deriveKey(stringToBytes(passphrase), salt);
            const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseEncryptionKey, keyUser);
            const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);
            const mnemonic = bytesToString(seedPhraseBytes);

            result.set(keySourceId, SeedPhraseWords.fromMnemonic(mnemonic));
        }

        return result;
    }

    async getSeedPhrasesWithBiometrics(prompt: AuthPrompt, keySourceIds: KeySourceId[]): Promise<Map<KeySourceId, SeedPhraseWords>> {
        const seedEncryptionKeyBase64 = await this.encryptedStorage.getItem(
            KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY,
            prompt
        );
        if (!seedEncryptionKeyBase64) {
            throw new AppError(`${KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY} not found in encrypted storage`);
        }
        const seedEncryptionKey = base64ToBytes(seedEncryptionKeyBase64);

        const result = new Map<KeySourceId, SeedPhraseWords>();
        for (const keySourceId of keySourceIds) {
            const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
            if (!encryptedSeedPhraseBase64) {
                throw new AppError(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
            }
            const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);

            const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);
            const mnemonic = bytesToString(seedPhraseBytes);
            result.set(keySourceId, SeedPhraseWords.fromMnemonic(mnemonic));
        }
        return result;
    }

    async reset(keySourceIds: KeySourceId[]): Promise<void> {
        await this.encryptedStorage.removeItem(SALT_KEY);
        await this.encryptedStorage.removeItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY);
        await this.encryptedStorage.removeItem(KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY);
        for (const keySourceId of keySourceIds) {
            await this.encryptedStorage.removeItem(this.encryptedSeedPhraseIdentifier(keySourceId));
        }
    }

    private encryptedSeedPhraseIdentifier(keySourceId: KeySourceId): string {
        return `encrypted_seed_phrase.${keySourceId}`;
    }
}