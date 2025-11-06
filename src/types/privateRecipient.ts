import { PubKey, pubKeyAffineToBase58 } from "@fatsolutions/tongo-sdk/dist/types";
import { ProjectivePoint, projectivePointToStarkPoint, pubKeyBase58ToAffine } from "@fatsolutions/tongo-sdk/dist/types";

export default class PrivateTokenAddress {
    readonly pubKey: PubKey;

    constructor(pubKey: PubKey) {
        this.pubKey = pubKey;
    }

    get hex(): string {
        return pubKeyAffineToBase58(this.pubKey);
    }

    static fromHex(hex: string): PrivateTokenAddress {
        const pubKey = projectivePointToStarkPoint(pubKeyBase58ToAffine(hex) as ProjectivePoint);
        return new PrivateTokenAddress(pubKey);
    }

    static fromHexOrNull(hex: string): PrivateTokenAddress | null {
        try {
            return PrivateTokenAddress.fromHex(hex);
        } catch (error) {
            return null;
        }
    }
}