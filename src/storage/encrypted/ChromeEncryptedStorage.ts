import { LOG } from "@/utils/logs";
import EncryptedStorage, { AuthPrompt } from "./EncryptedStorage";

/**
 * ChromeEncryptedStorage implements EncryptedStorage using Chrome's extension storage API.
 * 
 * Benefits over localStorage:
 * - More secure (extension-only access)
 * - Persists across browser restarts
 * - Can sync across devices (if using chrome.storage.sync)
 * - Larger storage quota (~5MB for local, ~100KB for sync)
 * 
 * Note: Currently uses chrome.storage.local (not encrypted by Chrome itself).
 * For true encryption, consider encrypting values before storing.
 */
export default class ChromeEncryptedStorage implements EncryptedStorage {

    constructor(
        private readonly applicationId: string,
    ) {}

    async getItem(
        key: string, 
        auth?: AuthPrompt
    ): Promise<string | null> {
        try {
            const storageKey = this.getService(key);
            
            // Use the background script bridge to access chrome.storage
            const response = await this.sendMessage({
                type: 'STORAGE_GET',
                keys: [storageKey]
            });

            if (!response.success) {
                LOG.error(`Failed to get item ${key} from Chrome storage:`, response.error);
                return null;
            }

            const value = response.data[storageKey];
            
            if (!value) {
                LOG.debug(`No value found for key ${key} in Chrome storage`);
                return null;
            }

            return value;
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
            const storageKey = this.getService(key);
            
            // Use the background script bridge to access chrome.storage
            const response = await this.sendMessage({
                type: 'STORAGE_SET',
                data: { [storageKey]: value }
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
            const storageKey = this.getService(key);
            
            // Use the background script bridge to access chrome.storage
            const response = await this.sendMessage({
                type: 'STORAGE_REMOVE',
                keys: [storageKey]
            });

            if (!response.success) {
                LOG.error(`Failed to remove item ${key} from Chrome storage:`, response.error);
            }
        } catch (e) {
            LOG.error(`ChromeEncryptedStorage.removeItem error for key ${key}:`, e);
        }
    }

    private getService(key: string): string {
        return `${this.applicationId}.${key}`;
    }

    /**
     * Sends a message to the background service worker and waits for a response.
     * This is a wrapper around chrome.runtime.sendMessage with Promise support.
     */
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
