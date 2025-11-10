import Account from "@/profile/account";
import { projectivePointToStarkPoint, PubKey, pubKeyAffineToBase58, pubKeyAffineToHex, pubKeyBase58ToAffine, pubKeyBase58ToHex } from "@/utils/fatSolutions";

export class PrivateTokenAddress {
    readonly pubKey: PubKey;

    constructor(pubKey: PubKey) {
        this.pubKey = pubKey;
    }

    get base58(): string {
        return pubKeyAffineToBase58(this.pubKey);
    }

    get hex(): string {
        return pubKeyAffineToHex(this.pubKey);
    }

    static fromBase58(base58: string): PrivateTokenAddress {
        const pubKey = projectivePointToStarkPoint(pubKeyBase58ToAffine(base58));
        return new PrivateTokenAddress(pubKey);
    }

    static fromBase58OrNull(base58: string): PrivateTokenAddress | null {
        try {
            return PrivateTokenAddress.fromBase58(base58);
        } catch (error) {
            return null;
        }
    }
}

export class PrivateTokenRecipient {
    readonly privateTokenAddress: PrivateTokenAddress;

    constructor(privateTokenAddress: PrivateTokenAddress) {
        this.privateTokenAddress = privateTokenAddress;
    }
}

export class WalletPrivateTokenRecipient extends PrivateTokenRecipient {
    readonly to: Account;
    
    constructor(to: Account, privateTokenAddress: PrivateTokenAddress) {
        super(privateTokenAddress);
        this.to = to;
    }
}