import { Platform } from "react-native";

/**
 * Returns the appropriate value based on the current platform, with Chrome extension support.
 * @param mobile - Value to return for iOS or Android platforms
 * @param web - Value to return for regular web platform
 * @param extension - Value to return for Chrome extension platform
 * @returns The mobile value for iOS/Android, extension value for Chrome extension, or web value for regular web
 */
export function platform<T>(
    mobile: () => T, 
    web: () => T,
    extension: () => T
): T {
    if (Platform.OS === "ios" || Platform.OS === "android") {
        return mobile();
    }

    // Check if running in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        return extension();
    }
    
    return web();
}

/**
 * Checks if the app is running as a Chrome extension.
 * @returns true if running in a Chrome extension, false otherwise
 */
export function isChromeExtension(): boolean {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
}


