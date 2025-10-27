import Keychain, { ACCESS_CONTROL, ACCESSIBLE, AuthenticationPrompt } from "react-native-keychain";
import EncryptedStorage, { AuthPrompt } from "./EncryptedStorage";

/**
 * Secure storage wrapper for react-native-keychain providing key-value storage with
 * configurable security levels based on biometric authentication requirements.
 * 
 * ## Security Levels
 * 
 * This class supports two security levels based on the presence of biometric authentication:
 * 
 * - **High Security**: When biometric auth is provided, uses hardware-backed encryption with
 *   biometric protection (AES_GCM on Android, iOS Keychain with biometric access control).
 * 
 * - **Medium Security**: When biometric auth is omitted, uses hardware-backed encryption without
 *   user authentication requirements (AES_GCM_NO_AUTH on Android, standard iOS Keychain).
 * 
 * @see {@link https://oblador.github.io/react-native-keychain/docs/platform-value-storage Platform value storage documentation}
 */
class KeychainStorage implements EncryptedStorage {

    /**
     * Creates a new KeychainStorage instance.
     * 
     * @param applicationId - The application bundle identifier used to namespace keychain entries.
     *                   Each key will be prefixed with this bundle ID to prevent collisions.
     */
    constructor(
        private readonly applicationId: string,
    ) {}

    /**
     * Retrieves a value from the device's secure keychain storage.
     * 
     * ## Security Levels
     * - **High Security (with biometric auth)**: When `auth` is provided, uses AES_GCM encryption 
     *   with biometric protection (Android) or keychain services with biometric access control (iOS).
     * 
     * - **Medium Security (without auth)**: When `auth` is omitted, uses AES_GCM_NO_AUTH encryption 
     *   without biometric requirements (Android) or standard keychain access (iOS).
     * 
     * ## Platform-Specific Behavior
     * 
     * ### Android
     * - Values are stored in Jetpack DataStore, encrypted with Android's Keystore system
     * - With biometric auth: Uses AES_GCM with biometric protection (highest security)
     * - Without auth: Uses AES_GCM_NO_AUTH (medium security, no user interaction required)
     * - Keys may be stored in Secure Hardware (StrongBox) or TEE depending on device capabilities
     * 
     * ### iOS
     * - Values are stored using keychain services as kSecClassGenericPassword
     * - Data persists across app installs for standalone apps
     * - Access controlled via kSecAttrAccessible attribute (WHEN_UNLOCKED)
     * 
     * @param key - Unique identifier for the stored value (will be namespaced with bundle ID)
     * @param auth - Optional biometric authentication prompt configuration. When provided,
     *               enables High Security mode requiring biometric verification.
     * @returns The stored value as a string, or null if retrieval fails
     * 
     * @example
     * ```typescript
     * // High Security: Retrieve sensitive data with biometric protection
     * const privateKey = await keychain.getItem('privateKey', {
     *   title: 'Authenticate to access wallet',
     *   subtitle: 'Biometric verification required'
     * });
     * 
     * // Medium Security: Retrieve non-sensitive data without biometric prompt
     * const saltBase64 = await keychain.getItem('salt');
     * ```
     * 
     * @see {@link https://oblador.github.io/react-native-keychain/docs/platform-value-storage Platform value storage documentation}
     */
    async getItem(
        key: string, 
        auth?: AuthPrompt
    ): Promise<string | null> {
        const value = await Keychain.getGenericPassword({
            service: this.getService(key),
            authenticationPrompt: auth ? this.promptToKeychainPrompt(auth) : undefined,
            accessControl: auth ? ACCESS_CONTROL.BIOMETRY_ANY : undefined,
        });

        if (!value) {
            console.error(`Failed to get item ${key} from keychain`);
            return null;
        }

        return value.password;
    }

    /**
     * Stores a value securely in the device's keychain storage.
     * 
     * ## Security Levels
     * - **High Security (with biometric auth)**: When `auth` is provided, uses AES_GCM encryption 
     *   with biometric protection (Android) or keychain services with biometric access control (iOS).
     * 
     * - **Medium Security (without auth)**: When `auth` is omitted, uses AES_GCM_NO_AUTH encryption 
     *   without biometric requirements (Android) or standard keychain access (iOS).
     * 
     * ## Platform-Specific Behavior
     * 
     * ### Android
     * - Values are stored in Jetpack DataStore, encrypted with Android's Keystore system
     * - With biometric auth: Uses AES_GCM with biometric protection (highest security)
     * - Without auth: Uses AES_GCM_NO_AUTH (medium security, no user interaction required)
     * - Keys may be stored in Secure Hardware (StrongBox) or TEE depending on device capabilities
     * 
     * ### iOS
     * - Values are stored using keychain services as kSecClassGenericPassword
     * - Data persists across app installs for standalone apps
     * - Accessible only when device is unlocked (WHEN_UNLOCKED)
     * - With biometric auth: Requires biometric verification for future access
     * 
     * @param key - Unique identifier for the value to store (will be namespaced with bundle ID)
     * @param value - The string value to store securely
     * @param auth - Optional biometric authentication prompt configuration. When provided,
     *               enables High Security mode and requires biometric verification for future access.
     * @returns true if the value was stored successfully, false otherwise
     * 
     * @example
     * ```typescript
     * // High Security: Store sensitive data with biometric protection
     * const success = await keychain.setItem(
     *   'privateKey',
     *   'sensitive_private_key_data',
     *   {
     *     title: 'Secure your wallet',
     *     subtitle: 'Biometric verification required'
     *   }
     * );
     * 
     * // Medium Security: Store non-sensitive data without biometric requirement
     * const success = await keychain.setItem('cacheKey', 'cached_data');
     * ```
     * 
     * @see {@link https://oblador.github.io/react-native-keychain/docs/platform-value-storage Platform value storage documentation}
     */
    async setItem(
        key: string, 
        value: string, 
        auth?: AuthPrompt
    ): Promise<boolean> {

        const result = await Keychain.setGenericPassword(
            key,
            value,
            {
                service: this.getService(key),
                authenticationPrompt: auth ? this.promptToKeychainPrompt(auth) : undefined,
                accessible: ACCESSIBLE.WHEN_UNLOCKED,
                accessControl: auth ? ACCESS_CONTROL.BIOMETRY_ANY : undefined, 
            }
        );
        
        if (!result) {
            console.error(`Failed to set item ${key} in keychain`);
            return false;
        }

        return true;
    }

    async removeItem(key: string): Promise<void> {
        await Keychain.resetGenericPassword({
            service: this.getService(key),
        });
    }

    private getService(key: string): string {
        return `${this.applicationId}.${key}`;
    }

    private promptToKeychainPrompt(prompt: AuthPrompt): AuthenticationPrompt {
        return {
            title: prompt.title,
            subtitle: prompt.subtitleAndroid,
            description: prompt.descriptionAndroid,
            cancel: prompt.cancelAndroid,
        };
    }
}

export default KeychainStorage;