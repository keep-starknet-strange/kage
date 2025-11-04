import { chacha20poly1305 } from "@noble/ciphers/chacha.js"
import { concatBytes } from "@noble/hashes/utils.js"
import { PKDFPerformer } from "../pbkdf/PKDFPerformer"
import { randomBytes } from "../utils/Random"
import { CryptoProvider } from './CryptoProvider'

const KEY_LENGTH = 32
const NONCE_LENGTH = 12
const PBKDF2_ITERATIONS = 200_000
const SALT_LENGTH = 32

/**
 * EMIP3 implementation of CryptoProvider.
 * Uses ChaCha20-Poly1305 for encryption and PBKDF2 with SHA-512 for key derivation.
 */
export class EMIP3CryptoProvider implements CryptoProvider {
  private readonly pbkdfPerformer: PKDFPerformer

  constructor(pbkdfPerformer: PKDFPerformer) {
    this.pbkdfPerformer = pbkdfPerformer
  }

  async deriveKey(
    passphrase: Uint8Array,
    salt: Uint8Array | Uint16Array,
  ): Promise<Uint8Array> {
    const saltAsUint8Array = new Uint8Array(salt)
    return await this.pbkdfPerformer.deriveKey(passphrase, saltAsUint8Array, PBKDF2_ITERATIONS, KEY_LENGTH)
  }

  async encrypt(
    data: Uint8Array,
    passphrase: Uint8Array,
  ): Promise<Uint8Array> {
    const salt = randomBytes(SALT_LENGTH)
    const key = await this.deriveKey(passphrase, salt)
    const nonce = randomBytes(NONCE_LENGTH)
    const cipher = chacha20poly1305(key, nonce)
    const encrypted = cipher.encrypt(data)
    return concatBytes(salt, nonce, encrypted)
  }

  async decrypt(
    encrypted: Uint8Array,
    passphrase: Uint8Array,
  ): Promise<Uint8Array> {
    const salt = encrypted.slice(0, SALT_LENGTH)
    const nonce = encrypted.slice(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH)
    const data = encrypted.slice(SALT_LENGTH + NONCE_LENGTH)
    const key = await this.deriveKey(passphrase, salt)
    const decipher = chacha20poly1305(key, nonce)
    return decipher.decrypt(data)
  }
}
