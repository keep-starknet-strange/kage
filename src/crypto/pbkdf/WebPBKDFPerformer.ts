import { PKDFPerformer } from "./PKDFPerformer";

export class WebPKDFPerformer implements PKDFPerformer {
    async deriveKey(passphrase: Uint8Array, salt: Uint8Array | Uint16Array, iterations: number, keyLength: number): Promise<Uint8Array> {
        const importedKey = await window.crypto.subtle.importKey(
            'raw',
            passphrase as BufferSource,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const pbkdf2Params: Pbkdf2Params = {
            name: 'PBKDF2',
            // Ensure salt is treated as a generic ArrayBuffer view
            salt: salt as BufferSource,
            iterations: iterations,
            hash: 'SHA-512', // Matches your 'sha512' algorithm
        };

        const finalKeyAlgorithm = {
            name: 'AES-GCM',
            length: keyLength * 8  // keyLength is in bytes, needs to be converted to bits (* 8)
        };

        // 4. Derive the final encryption key (as a CryptoKey object)
        const derivedKey = await window.crypto.subtle.deriveKey(
            pbkdf2Params,
            importedKey,
            finalKeyAlgorithm,
            true, // make it extractable
            ['encrypt', 'decrypt']
        );

        // 5. Export the derived key as raw bytes (Uint8Array)
        const rawKey = await window.crypto.subtle.exportKey('raw', derivedKey);

        return new Uint8Array(rawKey);
    }
}