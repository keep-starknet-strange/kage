import { LOG } from "@/utils/logs";
import { WebCryptoKeyManager } from "@/crypto/web/WebCryptoKeyManager";
import EncryptedStorage, { AuthPrompt } from "./EncryptedStorage";
import { stringToBytes } from "@/crypto/utils/encoding";

/**
 * Chrome Extension Encrypted Storage using non-extractable CryptoKey.
 * 
 * Values are encrypted with AES-256-GCM using a key stored in IndexedDB.
 * The key is marked as non-extractable, so raw key bytes are never exposed to JavaScript.
 * Storage keys are hashed with SHA-256 for deterministic lookup.
 */
export default class ChromeEncryptedStorage implements EncryptedStorage {
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
            
            const response = await this.sendMessage({
                type: 'STORAGE_GET',
                keys: [hashedKey]
            });

            if (!response.success) {
                LOG.error(`Failed to get item ${key} from Chrome storage:`, response.error);
                return null;
            }

            const encryptedValue = response.data[hashedKey];
            
            if (!encryptedValue) {
                LOG.debug(`No value found for key ${key} in Chrome storage`);
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
            LOG.error(`ChromeEncryptedStorage.getItem error for key ${key}:`, e);
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
            
            const response = await this.sendMessage({
                type: 'STORAGE_SET',
                data: { [hashedKey]: encryptedValue }
            });

            if (!response.success) {
                LOG.error(`Failed to set item ${key} in Chrome storage:`, response.error);
                return false;
            }

            return true;
        } catch (e) {
            LOG.error(`ChromeEncryptedStorage.setItem error for key ${key}:`, e);
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
            
            const response = await this.sendMessage({
                type: 'STORAGE_REMOVE',
                keys: [hashedKey]
            });

            if (!response.success) {
                LOG.error(`Failed to remove item ${key} from Chrome storage:`, response.error);
            }
        } catch (e) {
            LOG.error(`ChromeEncryptedStorage.removeItem error for key ${key}:`, e);
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

    private sendMessage(message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                reject(new Error('Chrome runtime not available'));
                return;
            }

            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(response);
            });
        });
    }
}
