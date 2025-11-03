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
    readonly index: number;
    // TODO Teddy: can store derivation path instead of jusst index later

    constructor(
        keySourceId: string,
        publicKey: string,
        index: number
    ) { 
        super(keySourceId, publicKey)
        this.index = index;
    }
}