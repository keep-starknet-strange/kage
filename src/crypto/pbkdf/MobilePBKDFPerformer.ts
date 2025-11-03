import { PKDFPerformer } from "./PKDFPerformer";

export class MobilePKDFPerformer implements PKDFPerformer {
    private readonly quickCrypto = require('react-native-quick-crypto');
    
    deriveKey(passphrase: Uint8Array, salt: Uint8Array | Uint16Array, iterations: number, keyLength: number): Promise<Uint8Array> {
        return this.quickCrypto.pbkdf2Sync(passphrase as any, salt as any, iterations, keyLength, 'sha512') as any
    }
}