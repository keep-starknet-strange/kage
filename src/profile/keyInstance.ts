import { KeySourceId } from "./keys/keySource";

export abstract class KeyInstance {
    readonly keySourceId: KeySourceId;
    readonly publicKey: string;

    constructor(
        keySourceId: string,
        publicKey: string,
    ) {
        this.keySourceId = keySourceId;
        this.publicKey = publicKey;
    }
}

export default class HDKeyInstance extends KeyInstance {
    readonly derivationPath: string;

    constructor(
        keySourceId: string,
        publicKey: string,
        derivationPath: string
    ) {
        super(keySourceId, publicKey)
        this.derivationPath = derivationPath;
    }
}