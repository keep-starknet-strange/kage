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
    private readonly quickCrypto = require('react-native-quick-crypto');
    
    async deriveKey(passphrase: Uint8Array, salt: Uint8Array | Uint16Array, iterations: number, keyLength: number): Promise<Uint8Array> {
        const result = await this.quickCrypto.pbkdf2Async(passphrase as any, salt as any, iterations, keyLength, 'sha512') as any
        return toUint8(result)
    }
}