
export interface PKDFPerformer {
    deriveKey(
        passphrase: Uint8Array, 
        salt: Uint8Array | Uint16Array,
        iterations: number,
        keyLength: number,
    ): Promise<Uint8Array>
}