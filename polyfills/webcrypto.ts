// Minimal WebCrypto SubtleCrypto polyfill for React Native (Expo)
// Originally supported only HKDF and has been extended to add PBKDF2 support so that
// code paths expecting SubtleCrypto PBKDF2 don't throw. 
// Note! this PBKDF2 implementation runs on the JS thread using @noble/hashes and is not a
// native acceleration. This functionality is treated as a functional fallback and
// does not meet our desired performance.

import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'

type CryptoKeyLike = { __raw: Uint8Array };

function toUint8Array(data: ArrayBuffer | ArrayBufferView | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  // Fallback; attempt to construct
  return new Uint8Array(data as any);
}

function ensureSubtle() {
  const g: any = globalThis as any;
  if (!g.crypto) g.crypto = {};
  if (g.crypto.subtle) return;

  const subtle: any = {
    // Marker to indicate this is a JS polyfill, not native
    __isPolyfill: true,
    __pbkdf2Engine: 'js',
    async importKey(
      format: string,
      keyData: ArrayBuffer | ArrayBufferView | Uint8Array,
      algorithm: string | Record<string, unknown>,
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKeyLike> {
      if (format !== 'raw') throw new Error('Only raw keys supported');
      const raw = toUint8Array(keyData);
      return { __raw: raw };
    },

    async deriveKey(
      params: { name: string; hash?: string; salt?: ArrayBuffer | Uint8Array; info?: ArrayBuffer | Uint8Array; length?: number; iterations?: number },
      baseKey: CryptoKeyLike,
      derivedKeyType: { name: string; hash?: string; length?: number },
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKeyLike> {
      if (!params || !params.name) throw new Error('Invalid deriveKey params');
      if (params.name === 'HKDF') {
        const salt = toUint8Array(params.salt!);
        const info = toUint8Array(params.info!);
        const ikm = baseKey.__raw;
        const length = params.length ?? (derivedKeyType.length ? Math.floor(derivedKeyType.length / 8) : 32);
        const okm = hkdf(sha256, ikm, salt, info, length);
        return { __raw: okm };
      }
      if (params.name === 'PBKDF2') {
        const salt = toUint8Array(params.salt!);
        const iterations = params.iterations ?? 1;
        const length = params.length ?? (derivedKeyType.length ? Math.floor(derivedKeyType.length / 8) : 32);
        const ikm = baseKey.__raw;
        const okm = await pbkdf2Async(sha512, ikm, salt, { c: iterations, dkLen: length });
        return { __raw: okm };
      }
      throw new Error('Only HKDF and PBKDF2 are supported');
    },

    async deriveBits(
      params: { name: string; hash?: string; salt?: ArrayBuffer | Uint8Array; iterations?: number },
      baseKey: CryptoKeyLike,
      length: number
    ): Promise<ArrayBuffer> {
      if (!params || !params.name) throw new Error('Invalid deriveBits params');
      if (params.name !== 'PBKDF2') throw new Error('deriveBits only supports PBKDF2');
      if (!params.salt) throw new Error('PBKDF2 requires salt');
      if (!params.iterations) throw new Error('PBKDF2 requires iterations');
      if (length % 8 !== 0) throw new Error('PBKDF2 deriveBits length must be multiple of 8');
      const dkLen = Math.floor(length / 8);
      const okm = await pbkdf2Async(sha512, baseKey.__raw, toUint8Array(params.salt), { c: params.iterations, dkLen });
      const buf = new Uint8Array(okm).buffer;
      return buf;
    },

    async exportKey(format: string, key: CryptoKeyLike): Promise<ArrayBuffer> {
      if (format !== 'raw') throw new Error('Only raw export supported');
      const raw = key.__raw;
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    },
  };

  g.crypto.subtle = subtle;
}

ensureSubtle();
