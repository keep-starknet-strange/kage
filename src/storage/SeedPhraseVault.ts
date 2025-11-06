import EncryptedStorage, { AuthPrompt } from "@/storage/encrypted/EncryptedStorage";
import { base64ToBytes, bytesToBase64, bytesToString, stringToBytes } from "@/crypto/utils/encoding";
import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { joinMnemonicWords } from "@starkms/key-management";
import { randomBytes } from "@/crypto/utils/Random";
import { KeySourceId } from "@/profile/keys/keySource";
import SeedPhraseWords from "@/types/seedPhraseWords";

const SALT_KEY = "salt";
const ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY = "encrypted_seed_phrase_encryption_key";
const KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY = "keychain_seed_phrase_encryption_key";

// TODO define errors instead of bools
export default class SeedPhraseVault {

    constructor(
        private readonly encryptedStorage: EncryptedStorage,
        private readonly cryptoProvider: CryptoProvider,
    ) { }

    async setup(passphrase: string, seedPhraseWords: string[]): Promise<boolean> {
        const passphraseBytes = stringToBytes(passphrase);
        const salt = randomBytes(32);

        const keyUser = await this.cryptoProvider.deriveKey(passphraseBytes, salt);
        const seedEncryptionKey = randomBytes(32);
        const seedPhraseBytes = stringToBytes(joinMnemonicWords(seedPhraseWords));

        const encryptedSeedPhrase = await this.cryptoProvider.encrypt(seedPhraseBytes, seedEncryptionKey);
        const encryptedSeedEncryptionKey = await this.cryptoProvider.encrypt(seedEncryptionKey, keyUser);

        const keySourceId = KeySourceId.from(seedPhraseWords);
        const saltSaved = await this.encryptedStorage.setItem(
            SALT_KEY,
            bytesToBase64(salt)
        );
        if (!saltSaved) {
            console.error(`Failed to store salt in encrypted storage for ${keySourceId}`);
            return false;
        }

        const encryptedSeedPhraseKeyUserSaved = await this.encryptedStorage.setItem(
            ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY,
            bytesToBase64(encryptedSeedEncryptionKey)
        );
        if (!encryptedSeedPhraseKeyUserSaved) {
            console.error(`Failed to store encrypted seed phrase encryption key in encrypted storage for ${keySourceId}`);
            return false;
        }

        const encryptedSeedPhraseSaved = this.encryptedStorage.setItem(
            this.encryptedSeedPhraseIdentifier(keySourceId),
            bytesToBase64(encryptedSeedPhrase)
        );
        if (!encryptedSeedPhraseSaved) {
            console.error(`Failed to store encrypted seed phrase in encrypted storage for ${keySourceId}`);
            return false;
        }

        return true;
    }

    async enableBiometrics(passphrase: string, prompt: AuthPrompt): Promise<boolean> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            console.error(`${SALT_KEY} not found in encrypted storage`);
            return false;
        }
        const salt = base64ToBytes(saltBase64);
        const keyUser = await this.cryptoProvider.deriveKey(stringToBytes(passphrase), salt);

        const encryptedSeedPhraseEncryptionKeyBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY);
        if (!encryptedSeedPhraseEncryptionKeyBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY} not found in encrypted storage`);
            return false;
        }
        const encryptedSeedPhraseEncryptionKey = base64ToBytes(encryptedSeedPhraseEncryptionKeyBase64);
        const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseEncryptionKey, keyUser);
        const stored = await this.encryptedStorage.setItem(
            KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY,
            bytesToBase64(seedEncryptionKey),
            prompt
        );
        if (!stored) {
            console.error("Failed to store seed encryption key in encrypted storage");
            return false;
        }

        return true;
    }

    async disableBiometrics(): Promise<void> {
        await this.encryptedStorage.removeItem(KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY);
    }

    async getSeedPhraseWithPassphrase(passphrase: string, keySourceId: KeySourceId): Promise<string | null> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            console.error(`${SALT_KEY} not found in encrypted storage`);
            return null;
        }
        const salt = base64ToBytes(saltBase64);

        const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
        if (!encryptedSeedPhraseBase64) {
            console.error(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
            return null;
        }
        const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);

        const encryptedSeedPhraseEncryptionKeyBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY)
        if (!encryptedSeedPhraseEncryptionKeyBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY} not found in keychain`);
            return null;
        }
        const encryptedSeedPhraseEncryptionKey = base64ToBytes(encryptedSeedPhraseEncryptionKeyBase64);

        const keyUser = await this.cryptoProvider.deriveKey(stringToBytes(passphrase), salt);
        const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseEncryptionKey, keyUser);
        const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);

        return bytesToString(seedPhraseBytes);
    }

    async getSeedPhrasesWithPassphrase(passphrase: string, keySourceIds: KeySourceId[]): Promise<Map<KeySourceId, SeedPhraseWords>> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            throw new Error(`${SALT_KEY} not found in encrypted storage`);
        }
        const salt = base64ToBytes(saltBase64);

        const encryptedSeedPhraseEncryptionKeyBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY)
        if (!encryptedSeedPhraseEncryptionKeyBase64) {
            throw new Error(`${ENCRYPTED_SEED_PHRASE_ENCRYPTION_KEY} not found in keychain`);
        }
        const encryptedSeedPhraseEncryptionKey = base64ToBytes(encryptedSeedPhraseEncryptionKeyBase64);

        const result = new Map<KeySourceId, SeedPhraseWords>();
        for (const keySourceId of keySourceIds) {
            const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
            if (!encryptedSeedPhraseBase64) {
                throw new Error(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
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

    async getSeedPhraseWithBiometrics(prompt: AuthPrompt, keySourceId: KeySourceId): Promise<string | null> {
        const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
        if (!encryptedSeedPhraseBase64) {
            console.error(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
            return null;
        }
        const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);

        const seedEncryptionKeyBase64 = await this.encryptedStorage.getItem(
            KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY,
            prompt
        );
        if (!seedEncryptionKeyBase64) {
            console.error(`${KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY} not found in encrypted storage`);
            return null;
        }
        const seedEncryptionKey = base64ToBytes(seedEncryptionKeyBase64);

        const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);
        return bytesToString(seedPhraseBytes);
    }

    async getSeedPhrasesWithBiometrics(prompt: AuthPrompt, keySourceIds: KeySourceId[]): Promise<Map<KeySourceId, SeedPhraseWords>> {
        const seedEncryptionKeyBase64 = await this.encryptedStorage.getItem(
            KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY,
            prompt
        );
        if (!seedEncryptionKeyBase64) {
            throw new Error(`${KEYCHAIN_SEED_PHRASE_ENCRYPTION_KEY} not found in encrypted storage`);
        }
        const seedEncryptionKey = base64ToBytes(seedEncryptionKeyBase64);

        const result = new Map<KeySourceId, SeedPhraseWords>();
        for (const keySourceId of keySourceIds) {
            const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(this.encryptedSeedPhraseIdentifier(keySourceId));
            if (!encryptedSeedPhraseBase64) {
                throw new Error(`Encrypted seed phrase not found in encrypted storage for ${keySourceId}`);
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