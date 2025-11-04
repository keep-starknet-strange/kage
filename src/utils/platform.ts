import { Platform } from "react-native";

/**
 * Returns the appropriate value based on the current platform.
 * @param mobile - Value to return for iOS or Android platforms
 * @param web - Value to return for web platform
 * @returns The mobile value for iOS/Android, or the web value for web
 */
export function platform<T>(mobile: () => T, web: () => T): T {
    return Platform.OS === "ios" || Platform.OS === "android" ? mobile() : web();
}


