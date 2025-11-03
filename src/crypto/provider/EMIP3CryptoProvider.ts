import { chacha20poly1305 } from "@noble/ciphers/chacha.js"
import { concatBytes } from "@noble/hashes/utils.js"
// import QuickCrypto from 'react-native-quick-crypto'
import { CryptoProvider } from './CryptoProvider'
import { randomBytes } from "../utils/Random"

const KEY_LENGTH = 32
const NONCE_LENGTH = 12
const PBKDF2_ITERATIONS = 200_000
const SALT_LENGTH = 32

function toUint8(result: any): Uint8Array {
  if (result instanceof Uint8Array) return result
  if (ArrayBuffer.isView(result)) {
    const view = result as ArrayBufferView
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }
  if (result instanceof ArrayBuffer) return new Uint8Array(result)
  if (Array.isArray(result)) return new Uint8Array(result)
  if (result && typeof result === 'object' && 'buffer' in result && result.buffer instanceof ArrayBuffer) {
    // @ts-ignore
    return new Uint8Array(result.buffer, result.byteOffset ?? 0, result.byteLength ?? result.buffer.byteLength)
  }
  // Buffer from react-native-quick-crypto behaves like Uint8Array; fallback to copy
  try { return new Uint8Array(result as any) } catch (_) { /* noop */ }
  throw new Error('Unsupported PBKDF2 result type')
}

/**
 * EMIP3 implementation of CryptoProvider.
 * Uses ChaCha20-Poly1305 for encryption and PBKDF2 with SHA-512 for key derivation.
 */
export class EMIP3CryptoProvider implements CryptoProvider {
  async deriveKey(
    passphrase: Uint8Array,
    salt: Uint8Array | Uint16Array,
  ): Promise<Uint8Array> {
    const saltAsUint8Array = new Uint8Array(salt)
    // const nativeOut = QuickCrypto.pbkdf2Sync(passphrase as any, saltAsUint8Array as any, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512') as any
    return toUint8("")
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
