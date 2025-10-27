import { chacha20poly1305 } from "@noble/ciphers/chacha"
import { pbkdf2Async as noblePbkdf2Async } from "@noble/hashes/pbkdf2"
import { sha512 } from "@noble/hashes/sha2"
import { concatBytes } from "@noble/hashes/utils"
import { pbkdf2Sync as nativePbkdf2Sync } from 'react-native-quick-crypto'
import { CryptoProvider } from './CryptoProvider'
import { randomBytes } from "../utils/Random"

const KEY_LENGTH = 32
const NONCE_LENGTH = 12
const DESIRED_PBKDF2_ITERATIONS = 200_000
const FALLBACK_PBKDF2_ITERATIONS = 10_000
const SALT_LENGTH = 32

// Debug logging to help figure out which PBKDF2 engine is used and how long it takes
const PBKDF2_DEBUG = true

// Timer function
function nowMs(): number {
  // Avoid requiring performance polyfills
  return (typeof performance !== 'undefined' && (performance as any)?.now) ? performance.now() : Date.now()
}

function isHermes(): boolean {
  return typeof (globalThis as any).HermesInternal === 'object'
}

// A function that uses the subtle crypto functionality instead of the JS implementation in @noble packages
// First tries deriveBits; if unavailable, tries deriveKey+exportKey to get raw bytes.
async function pbkdf2WithSubtle(passphrase: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number): Promise<{ key: Uint8Array; mode: 'deriveBits' | 'deriveKey' }> {
  const g: any = globalThis as any
  const subtle = g?.crypto?.subtle
  if (!subtle) throw new Error('SubtleCrypto unavailable')
  if (typeof subtle.importKey !== 'function') {
    throw new Error('SubtleCrypto missing required method importKey')
  }
  if (typeof subtle.deriveBits === 'function') {
    const keyMaterial = await subtle.importKey('raw', passphrase, 'PBKDF2', false, ['deriveBits'])
    const bits = await subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-512' }, keyMaterial, dkLen * 8)
    return { key: new Uint8Array(bits as ArrayBuffer), mode: 'deriveBits' }
  }
  if (typeof subtle.deriveKey === 'function' && typeof subtle.exportKey === 'function') {
    const keyMaterial = await subtle.importKey('raw', passphrase, 'PBKDF2', false, ['deriveKey'])
    const derivedKey = await subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-512' },
      keyMaterial,
      { name: 'AES-GCM', length: dkLen * 8 },
      true,
      ['encrypt', 'decrypt']
    )
    const raw = await subtle.exportKey('raw', derivedKey)
    return { key: new Uint8Array(raw as ArrayBuffer), mode: 'deriveKey' }
  }
  throw new Error('SubtleCrypto missing PBKDF2 capabilities (deriveBits/deriveKey)')
}

function toUint8(result: any): Uint8Array {
  if (result instanceof Uint8Array) return result
  if (ArrayBuffer.isView(result)) {
    const view = result as ArrayBufferView
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }
  if (result instanceof ArrayBuffer) return new Uint8Array(result)
  if (Array.isArray(result)) return new Uint8Array(result)
  // try to construct from object with .buffer
  if (result && typeof result === 'object' && 'buffer' in result && result.buffer instanceof ArrayBuffer) {
    // @ts-ignore
    return new Uint8Array(result.buffer, result.byteOffset ?? 0, result.byteLength ?? result.buffer.byteLength)
  }
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
    const t0 = PBKDF2_DEBUG ? nowMs() : 0
    const hermes = PBKDF2_DEBUG ? isHermes() : false
    let used: 'quick-crypto' | 'subtle' | 'noble-js' = 'noble-js'
    let reason: string | undefined

    const g: any = globalThis as any
    let hasSubtle = !!(g?.crypto?.subtle)
    let hasDerive = hasSubtle && typeof g.crypto.subtle.deriveBits === 'function'
    let hasImport = hasSubtle && typeof g.crypto.subtle.importKey === 'function'
    let hasDeriveKey = hasSubtle && typeof g.crypto.subtle.deriveKey === 'function'
    let hasExportKey = hasSubtle && typeof g.crypto.subtle.exportKey === 'function'
    const subtleAny: any = hasSubtle ? (g.crypto.subtle as any) : undefined
    const isJsPolyfill = !!(subtleAny && (subtleAny.__pbkdf2Engine === 'js' || subtleAny.__isPolyfill))
    // Prefer native QuickCrypto or native Subtle for high iterations; otherwise fallback to a lower iteration count for JS
    const iters = (hasSubtle && !isJsPolyfill && (hasDerive || (hasDeriveKey && hasExportKey)) && hasImport)
      ? DESIRED_PBKDF2_ITERATIONS
      : FALLBACK_PBKDF2_ITERATIONS
    if (PBKDF2_DEBUG) {
      console.log(`[PBKDF2] start hermes=${hermes} hasSubtle=${hasSubtle} polyfillJs=${isJsPolyfill} hasDeriveBits=${hasDerive} hasImportKey=${hasImport} hasDeriveKey=${hasDeriveKey} hasExportKey=${hasExportKey} iters=${iters}`)
    }

    // Try react-native-quick-crypto (Node-style crypto) first
    try {
      const nativeOut = nativePbkdf2Sync(passphrase as any, saltAsUint8Array as any, DESIRED_PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512') as any
      const outBytes = toUint8(nativeOut)
      used = 'quick-crypto'
      if (PBKDF2_DEBUG) {
        const t1 = nowMs()
        console.log(`[PBKDF2] engine=${used} hermes=${hermes} iters=${DESIRED_PBKDF2_ITERATIONS} dkLen=${KEY_LENGTH} took=${(t1 - t0).toFixed(2)}ms`)
      }
      return outBytes
    } catch (e: any) {
      if (PBKDF2_DEBUG) {
        console.log(`[PBKDF2] quick-crypto unavailable => trying subtle: ${e?.message || String(e)}`)
      }
    }

    // Prefer subtle (native/WebCrypto) when available for performance.
    if (hasSubtle && !isJsPolyfill && (hasDerive || (hasDeriveKey && hasExportKey)) && hasImport) {
      try {
        const { key: out, mode } = await pbkdf2WithSubtle(passphrase, saltAsUint8Array, iters, KEY_LENGTH)
        used = 'subtle'
        if (PBKDF2_DEBUG) {
          const t1 = nowMs()
          console.log(`[PBKDF2] engine=${used}:${mode} hermes=${hermes} iters=${iters} dkLen=${KEY_LENGTH} took=${(t1 - t0).toFixed(2)}ms`)
        }
        return out
      } catch (e: any) {
        reason = e?.message || String(e)
        if (PBKDF2_DEBUG) {
          console.log(`[PBKDF2] subtle error => falling back: ${reason}`)
        }
        // fall through to JS implementation
      }
    }

    // Original fallback, the pure JS implementation which is slow at high iteration counts and bad for UX.
    const out = await noblePbkdf2Async(sha512, passphrase, saltAsUint8Array, { c: iters, dkLen: KEY_LENGTH })
    if (PBKDF2_DEBUG) {
      const t1 = nowMs()
      console.log(`[PBKDF2] engine=${used} hermes=${hermes} iters=${iters} dkLen=${KEY_LENGTH} took=${(t1 - t0).toFixed(2)}ms` + (reason ? ` (subtle unavailable: ${reason})` : ''))
    }
    return out
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
