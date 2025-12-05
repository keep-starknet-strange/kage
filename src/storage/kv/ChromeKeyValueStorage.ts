import KeyValueStorage from './KeyValueStorage';
import { KeyValueSchema } from './KeyValueSchema';
import { LOG } from '@/utils/logs';

/**
 * ChromeKeyValueStorage implements KeyValueStorage using Chrome's extension storage API.
 * 
 * Benefits over localStorage:
 * - More secure (extension-only access)
 * - Persists across browser restarts
 * - Can sync across devices (if using chrome.storage.sync)
 * - Larger storage quota (~5MB for local, ~100KB for sync)
 * - Better for storing wallet data and user preferences
 */
export default class ChromeKeyValueStorage implements KeyValueStorage {
    
    /**
     * Retrieves the value associated with the given key.
     * @param key The key whose value to retrieve.
     * @returns The deserialized value, or null if the key does not exist.
     */
    async get<K extends keyof KeyValueSchema>(key: K): Promise<KeyValueSchema[K] | null> {
        try {
            const response = await this.sendMessage({
                type: 'STORAGE_GET',
                keys: [key as string]
            });

            if (!response.success) {
                LOG.error(`Failed to get value for key ${String(key)}:`, response.error);
                return null;
            }

            const serializedValue = response.data[key as string];
            
            if (serializedValue === null || serializedValue === undefined) {
                return null;
            }

            // Values are already stored as JSON strings, parse them
            try {
                return JSON.parse(serializedValue) as KeyValueSchema[K];
            } catch (e) {
                LOG.error(`Failed to deserialize value for key "${String(key)}":`, e);
                return null;
            }
        } catch (e) {
            LOG.error(`ChromeKeyValueStorage.get error for key ${String(key)}:`, e);
            return null;
        }
    }

    /**
     * Retrieves the value associated with the given key, or returns the provided default if the key does not exist.
     * @param key The key whose value to retrieve.
     * @param defaultValue The default value to return if the key does not exist.
     * @returns The stored value, or the default if not found.
     */
    async getOrDefault<K extends keyof KeyValueSchema>(key: K, defaultValue: KeyValueSchema[K]): Promise<KeyValueSchema[K]> {
        const value = await this.get(key);
        return value ?? defaultValue;
    }

    /**
     * Associates the given value with the key. 
     * If value is null or undefined, the key should be removed.
     * @param key The key to set.
     * @param value The value to store.
     */
    async set<K extends keyof KeyValueSchema>(key: K, value: KeyValueSchema[K]): Promise<void> {
        if (value === null || value === undefined) {
            await this.remove(key);
            return;
        }

        try {
            const serializedValue = JSON.stringify(value);
            
            const response = await this.sendMessage({
                type: 'STORAGE_SET',
                data: { [key as string]: serializedValue }
            });

            if (!response.success) {
                LOG.error(`Failed to set value for key ${String(key)}:`, response.error);
            }
        } catch (e) {
            LOG.error(`ChromeKeyValueStorage.set error for key ${String(key)}:`, e);
        }
    }

    /**
     * Removes the key and its associated value from storage.
     * @param key The key to remove.
     */
    async remove<K extends keyof KeyValueSchema>(key: K): Promise<void> {
        try {
            const response = await this.sendMessage({
                type: 'STORAGE_REMOVE',
                keys: [key as string]
            });

            if (!response.success) {
                LOG.error(`Failed to remove key ${String(key)}:`, response.error);
            }
        } catch (e) {
            LOG.error(`ChromeKeyValueStorage.remove error for key ${String(key)}:`, e);
        }
    }

    /**
     * Removes all keys and values from the storage.
     */
    async clear(): Promise<void> {
        try {
            const response = await this.sendMessage({
                type: 'STORAGE_CLEAR'
            });

            if (!response.success) {
                LOG.error(`Failed to clear storage:`, response.error);
            }
        } catch (e) {
            LOG.error(`ChromeKeyValueStorage.clear error:`, e);
        }
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
