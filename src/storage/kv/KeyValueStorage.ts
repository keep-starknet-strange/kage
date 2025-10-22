import { KeyValueSchema } from "./KeyValueSchema";

/**
 * Interface for generic asynchronous key-value storage.
 * 
 * Provides methods to get, set, and remove values, all as strings.
 * Implementations could wrap device storage, secure storage, or in-memory storage.
 */
export default interface KeyValueStorage {
    /**
     * Retrieves the value associated with the given key.
     * @param key The key whose value to retrieve.
     * @returns The string value, or null if the key does not exist.
     */
    get<K extends keyof KeyValueSchema>(key: K): Promise<KeyValueSchema[K] | null>;

    /**
     * Retrieves the value associated with the given key, or returns the provided default if the key does not exist.
     * @param key The key whose value to retrieve.
     * @param defaultValue The default value to return if the key does not exist.
     * @returns The stored value, or the default if not found.
     */
    getOrDefault<K extends keyof KeyValueSchema>(key: K, defaultValue: KeyValueSchema[K]): Promise<KeyValueSchema[K]>;

    /**
     * Associates the given value with the key. 
     * If value is null or undefined, the key should be removed.
     * @param key The key to set.
     * @param value The value to store.
     */
    set<K extends keyof KeyValueSchema>(key: K, value: KeyValueSchema[K]): Promise<void>;

    /**
     * Removes the key and its associated value from storage.
     * @param key The key to remove.
     */
    remove<K extends keyof KeyValueSchema>(key: K): Promise<void>;

    /**
     * Removes all keys and values from the storage.
     */
    clear(): Promise<void>;
}
