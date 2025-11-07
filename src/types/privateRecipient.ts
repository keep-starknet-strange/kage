import Account from "@/profile/account";
import { projectivePointToStarkPoint, PubKey, pubKeyAffineToBase58, pubKeyBase58ToAffine } from "@/utils/fatSolutions";

export class PrivateTokenAddress {
    readonly pubKey: PubKey;

    constructor(pubKey: PubKey) {
        this.pubKey = pubKey;
    }

    get hex(): string {
        return pubKeyAffineToBase58(this.pubKey);
    }

    static fromHex(hex: string): PrivateTokenAddress {
        const pubKey = projectivePointToStarkPoint(pubKeyBase58ToAffine(hex));
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