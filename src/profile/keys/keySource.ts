import { getStarknetPublicKeyFromPrivate, grindKey, joinMnemonicWords, StarknetKeyConst } from "@starkms/key-management";
import { KeySourceKind } from "./keySourceKind";
import { CoinType } from "./coinType";
import { ethers } from "ethers";
import { encode } from "starknet";
import Identifiable from "@/types/Identifiable";

export type KeySourceId = string;

export namespace KeySourceId {
    const { addHexPrefix } = encode;

    export function from(seedPhraseWords: string[]): KeySourceId {
        const getIdPath = `m/${StarknetKeyConst.PURPOSE}'/${CoinType.STARKNET}'/365'`
        const mnemonic = joinMnemonicWords(seedPhraseWords);
        const derivedNode = ethers.HDNodeWallet.fromPhrase(
            mnemonic,
            undefined,
            getIdPath,
        )

        const privateKeyHex = addHexPrefix(grindKey(derivedNode.privateKey));
        return getStarknetPublicKeyFromPrivate(privateKeyHex, true);
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

    static fromSeedPhrase(seedPhraseWords: string[]): KeySource {
        const id = KeySourceId.from(seedPhraseWords);
        return new KeySource(id, KeySourceKind.SEED_PHRASE);
    }
}