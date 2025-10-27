import { EMIP3CryptoProvider } from "./EMIP3CryptoProvider"


/**
 * Interface for cryptographic operations with passphrase-based encryption.
 * Implementations should provide secure key derivation, encryption, and decryption.
 */
export interface CryptoProvider {
    /**
     * Derives a cryptographic key from a passphrase and salt.
     * @param passphrase - The passphrase to derive the key from
     * @param salt - The salt to use in key derivation
     * @returns A promise that resolves to the derived key
     */
    deriveKey(passphrase: Uint8Array, salt: Uint8Array | Uint16Array): Promise<Uint8Array>
  
    /**
     * Encrypts data using a passphrase.
     * @param data - The data to encrypt
     * @param passphrase - The passphrase to use for encryption
     * @returns A promise that resolves to the encrypted data (may include salt, nonce, and ciphertext)
     */
    encrypt(data: Uint8Array, passphrase: Uint8Array): Promise<Uint8Array>
  
    /**
     * Decrypts data using a passphrase.
     * @param encrypted - The encrypted data to decrypt
     * @param passphrase - The passphrase to use for decryption
     * @returns A promise that resolves to the decrypted data
     */
    decrypt(encrypted: Uint8Array, passphrase: Uint8Array): Promise<Uint8Array>
  }

// Default implementation of CryptoProvider
export const cryptoProvider = new EMIP3CryptoProvider()