import { kmsProvider } from "@/crypto/kms/KMSProvider";
import Identifiable from "@/types/Identifiable";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { KeySourceKind } from "./keySourceKind";

export type KeySourceId = string;

export namespace KeySourceId {
    export function from(seedPhrase: SeedPhraseWords): KeySourceId {
        const keyPair = kmsProvider.deriveKeyPair({
            type: "get-id",
        }, seedPhrase);
        
        return keyPair.publicKey;
    }
}

export default class KeySource implements Identifiable {
    readonly id: KeySourceId;
    readonly kind: KeySourceKind;

    constructor(
        id: KeySourceId,
        kind: KeySourceKind
    ) {
        this.id = id;
        this.kind = kind;
    }

    static fromSeedPhrase(seedPhrase: SeedPhraseWords): KeySource {
        const id = KeySourceId.from(seedPhrase);
        return new KeySource(id, KeySourceKind.SEED_PHRASE);
    }
}