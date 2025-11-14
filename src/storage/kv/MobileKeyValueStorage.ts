import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyValueStorage from './KeyValueStorage';
import { KeyValueSchema } from './KeyValueSchema';
import { LOG } from '@/utils/logs';

/**
 * MobileKeyValueStorage implements KeyValueStorage using react-native-async-storage.
 * Stores all values as strings.
 */
export default class MobileKeyValueStorage implements KeyValueStorage {
    /**
     * Retrieves the value associated with the given key.
     * @param key The key whose value to retrieve.
     * @returns The string value, or null if the key does not exist.
     */
    async get<K extends keyof KeyValueSchema>(key: K): Promise<KeyValueSchema[K] | null> {
        let serializedValue;
        try {
            serializedValue = await AsyncStorage.getItem(key);
            if (serializedValue === null) {
                return null;
            }
        } catch (e) {
            LOG.error(`Failed to get value for key ${key}:`, e);
            return null;
        }

        try {
            return JSON.parse(serializedValue) as KeyValueSchema[K];
        } catch (e) {
            LOG.error(`Failed to deserialize value ${serializedValue} for key "${key}":`, e);
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
            try {
                await this.remove(key);
            } catch (e) {
                LOG.error(`Failed to remove item ${key}:`, e);
            }
            return;
        }

        let serializedValue;
        try {
            serializedValue = JSON.stringify(value);
        } catch (e) {
            LOG.error(`Failed to serialize value ${value} for key "${key}":`, e);
            return;
        }

        try {
            await AsyncStorage.setItem(key, serializedValue);
        } catch (e) {
            LOG.error(`MobileKeyValueStorage.setItem error:`, e);
        }
    }

    /**
     * Removes the key and its associated value from storage.
     * @param key The key to remove.
     */
    async remove<K extends keyof KeyValueSchema>(key: K): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            LOG.error(`MobileKeyValueStorage.removeItem error:`, e);
        }
    }

    /**
     * Removes all keys and values from the storage.
     */
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            LOG.error(`MobileKeyValueStorage.clear error:`, e);
        }
    }
}
