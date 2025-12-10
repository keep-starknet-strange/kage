import { LOG } from "@/utils/logs";
import { WebCryptoKeyManager } from "@/crypto/web/WebCryptoKeyManager";
import EncryptedStorage, { AuthPrompt } from "./EncryptedStorage";
import { stringToBytes } from "@/crypto/utils/encoding";

/**
 * Web Encrypted Storage using non-extractable CryptoKey.
 * 
 * Values are encrypted with AES-256-GCM using a key stored in IndexedDB.
 * The key is marked as non-extractable, so raw key bytes are never exposed to JavaScript.
 * Storage keys are hashed with SHA-256 for deterministic lookup.
 */
export default class WebEncryptedStorage implements EncryptedStorage {
    private keyManager: WebCryptoKeyManager;
    private initialized: boolean = false;

    constructor(
        private readonly applicationId: string,
    ) {
        this.keyManager = new WebCryptoKeyManager(applicationId);
    }

    private async ensureInitialized(): Promise<boolean> {
        if (this.initialized) {
            return true;
        }

        const success = await this.keyManager.initialize();
        if (success) {
            this.initialized = true;
        }
        return success;
    }

    async getItem(
        key: string, 
        auth?: AuthPrompt
    ): Promise<string | null> {
        try {
            if (!await this.ensureInitialized()) {
                LOG.error(`Failed to initialize encryption for getItem ${key}`);
                return null;
            }

            const serviceKey = this.getService(key);
            const hashedKey = await this.keyManager.hashKey(serviceKey);
            
            const encryptedValue = localStorage.getItem(hashedKey);
            
            if (!encryptedValue) {
                LOG.debug(`No value found for key ${key} in web encrypted storage`);
                return null;
            }

            const encryptedBytes = this.base64ToBytes(encryptedValue);
            const decryptedBytes = await this.keyManager.decrypt(encryptedBytes);
            
            if (!decryptedBytes) {
                LOG.error(`Failed to decrypt value for key ${key}`);
                return null;
            }

            return new TextDecoder().decode(decryptedBytes);
        } catch (e) {
            LOG.error(`WebEncryptedStorage.getItem error for key ${key}:`, e);
            return null;
        }
    }

    async setItem(
        key: string, 
        value: string, 
        auth?: AuthPrompt
    ): Promise<boolean> {
        try {
            if (!await this.ensureInitialized()) {
                LOG.error(`Failed to initialize encryption for setItem ${key}`);
                return false;
            }

            const serviceKey = this.getService(key);
            const hashedKey = await this.keyManager.hashKey(serviceKey);
            
            const valueBytes = stringToBytes(value);
            const encryptedBytes = await this.keyManager.encrypt(valueBytes);
            
            if (!encryptedBytes) {
                LOG.error(`Failed to encrypt value for key ${key}`);
                return false;
            }

            const encryptedValue = this.bytesToBase64(encryptedBytes);
            localStorage.setItem(hashedKey, encryptedValue);

            return true;
        } catch (e) {
            LOG.error(`WebEncryptedStorage.setItem error for key ${key}:`, e);
            return false;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            if (!await this.ensureInitialized()) {
                LOG.error(`Failed to initialize encryption for removeItem ${key}`);
                return;
            }

            const serviceKey = this.getService(key);
            const hashedKey = await this.keyManager.hashKey(serviceKey);
            localStorage.removeItem(hashedKey);
        } catch (e) {
            LOG.error(`WebEncryptedStorage.removeItem error for key ${key}:`, e);
        }
    }

    async deleteEncryptionKey(): Promise<void> {
        await this.keyManager.deleteKey();
        this.initialized = false;
    }

    private getService(key: string): string {
        return `${this.applicationId}.${key}`;
    }

    private bytesToBase64(bytes: Uint8Array): string {
        return btoa(String.fromCharCode(...bytes));
    }

    private base64ToBytes(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}