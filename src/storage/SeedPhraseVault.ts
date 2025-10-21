import EncryptedStorage, { AuthPrompt } from "@/storage/EncryptedStorage";
import { base64ToBytes, bytesToBase64, bytesToString, stringToBytes } from "@/crypto/utils/encoding";
import { randomBytes } from "@noble/hashes/utils";
import { CryptoProvider } from "@/crypto/provider/CryptoProvider";

const SALT_KEY = "salt";
const ENCRYPTED_SEED_PHRASE = "encrypted_seed_phrase";
const ENCRYPTED_SEED_PHRASE_KEY_USER = "encrypted_seed_phrase_key_user";
const KEYCHAIN_SEED_ENCRYPTION_KEY = "keychain_seed_encryption_key";

// TODO define errors instead of bools
export default class SeedPhraseVault {

    constructor(
        private readonly encryptedStorage: EncryptedStorage,
        private readonly cryptoProvider: CryptoProvider,
    ) {}

    async setup(passphrase: string, seedPhrase: string): Promise<boolean> {
        const passphraseBytes = stringToBytes(passphrase);
        const salt = randomBytes(32);

        const keyUser = await this.cryptoProvider.deriveKey(passphraseBytes, salt);

        const seedEncryptionKey = randomBytes(32);
        const seedPhraseBytes = stringToBytes(seedPhrase);

        const encryptedSeedPhrase = await this.cryptoProvider.encrypt(seedPhraseBytes, seedEncryptionKey); 
        const encryptedSeedPhraseKeyUser = await this.cryptoProvider.encrypt(encryptedSeedPhrase, keyUser);

        const saltSaved = await this.encryptedStorage.setItem(SALT_KEY, bytesToBase64(salt));
        if (!saltSaved) {
            console.error(`Failed to store ${SALT_KEY} in encrypted storage`);
            return false;
        }
        const encryptedSeedPhraseSaved = this.encryptedStorage.setItem(ENCRYPTED_SEED_PHRASE, bytesToBase64(encryptedSeedPhrase));
        if (!encryptedSeedPhraseSaved) {
            console.error(`Failed to store ${ENCRYPTED_SEED_PHRASE} in encrypted storage`);
            return false;
        }
        const encryptedSeedPhraseKeyUserSaved = await this.encryptedStorage.setItem(ENCRYPTED_SEED_PHRASE_KEY_USER, bytesToBase64(encryptedSeedPhraseKeyUser));
        if (!encryptedSeedPhraseKeyUserSaved) {
            console.error(`Failed to store ${ENCRYPTED_SEED_PHRASE_KEY_USER} in encrypted storage`);
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

        const encryptedSeedPhraseKeyUserBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_KEY_USER);
        if (!encryptedSeedPhraseKeyUserBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE_KEY_USER} not found in encrypted storage`);
            return false;
        }
        const encryptedSeedPhraseKeyUser = base64ToBytes(encryptedSeedPhraseKeyUserBase64);
        const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseKeyUser, keyUser);


        const stored = await this.encryptedStorage.setItem(
            KEYCHAIN_SEED_ENCRYPTION_KEY, 
            bytesToBase64(seedEncryptionKey),
            prompt
        );
        if (!stored) {
            console.error("Failed to store seed encryption key in encrypted storage");
            return false;
        }

        return true;
    }

    async getSeedPhraseWithPassphrase(passphrase: string): Promise<string | null> {
        const saltBase64 = await this.encryptedStorage.getItem(SALT_KEY);
        if (!saltBase64) {
            console.error(`${SALT_KEY} not found in encrypted storage`);
            return null;
        }
        const salt = base64ToBytes(saltBase64);
        
        const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE);
        if (!encryptedSeedPhraseBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE} not found in encrypted storage`);
            return null;
        }
        const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);
        
        const encryptedSeedPhraseKeyUserBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE_KEY_USER)
        if (!encryptedSeedPhraseKeyUserBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE_KEY_USER} not found in keychain`);
            return null;
        }
        const encryptedSeedPhraseKeyUser = base64ToBytes(encryptedSeedPhraseKeyUserBase64);


        const keyUser = await this.cryptoProvider.deriveKey(stringToBytes(passphrase), salt);
        const seedEncryptionKey = await this.cryptoProvider.decrypt(encryptedSeedPhraseKeyUser, keyUser);        
        const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);

        return bytesToString(seedPhraseBytes);
    }

    async getSeedPhraseWithBiometrics(prompt: AuthPrompt): Promise<string | null> {
        const encryptedSeedPhraseBase64 = await this.encryptedStorage.getItem(ENCRYPTED_SEED_PHRASE);
        if (!encryptedSeedPhraseBase64) {
            console.error(`${ENCRYPTED_SEED_PHRASE} not found in encrypted storage`);
            return null;
        }
        const encryptedSeedPhrase = base64ToBytes(encryptedSeedPhraseBase64);

        const seedEncryptionKeyBase64 = await this.encryptedStorage.getItem(
            KEYCHAIN_SEED_ENCRYPTION_KEY,
            prompt
        );
        if (!seedEncryptionKeyBase64) {
            console.error(`${KEYCHAIN_SEED_ENCRYPTION_KEY} not found in encrypted storage`);
            return null;
        }
        const seedEncryptionKey = base64ToBytes(seedEncryptionKeyBase64);

        const seedPhraseBytes = await this.cryptoProvider.decrypt(encryptedSeedPhrase, seedEncryptionKey);
        return bytesToString(seedPhraseBytes);
    }
}