/**
 * Converts a string to Uint8Array using UTF-8 encoding.
 * Use this for text data like passphrases or seed phrases.
 */
export const stringToBytes = (str: string): Uint8Array => {
  return new TextEncoder().encode(str)
}

/**
 * Converts a Uint8Array to string using UTF-8 decoding.
 * Use this for decrypted text data.
 */
export const bytesToString = (bytes: Uint8Array): string => {
  return new TextDecoder().decode(bytes)
}

/**
 * Converts a Uint8Array to base64 string for storage.
 * Use this for encrypted data or any binary data that needs to be stored as a string.
 */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  // Buffer is not available in React Native. Use btoa for base64 encoding.
  return globalThis.btoa(String.fromCharCode(...bytes));
}

/**
 * Converts a base64 string back to Uint8Array.
 * Use this when retrieving encrypted data from storage.
 */
export const base64ToBytes = (base64: string): Uint8Array => {
  // Use atob and TextEncoder/TextDecoder for environments where Buffer is not available
  const binaryString = globalThis.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

