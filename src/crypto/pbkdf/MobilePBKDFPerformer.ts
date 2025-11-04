import { PKDFPerformer } from "./PKDFPerformer";

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

export class MobilePKDFPerformer implements PKDFPerformer {
  private quickCrypto: any;

  constructor() {
    // Synchronously require react-native-quick-crypto at runtime
    this.quickCrypto = require('react-native-quick-crypto');
  }

  async deriveKey(passphrase: Uint8Array, salt: Uint8Array | Uint16Array, iterations: number, keyLength: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      this.quickCrypto.pbkdf2(
        passphrase as any,
        salt as any,
        iterations,
        keyLength,
        'sha512',
        (err: any, result: any) => {
          if (err) reject(err)
          resolve(toUint8(result))
        }
      )
    })
  }
}