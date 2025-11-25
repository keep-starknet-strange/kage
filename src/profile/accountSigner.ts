import { AccessVaultState } from "@/stores/accessVaultStore";
import { ec, Signature, Signer } from "starknet";
import Account from "./account";
import { AppError } from "@/types/appError";

export class AccountSigner extends Signer {

    private readonly account: Account;
    private readonly vault: AccessVaultState;

    constructor(account: Account, vault: AccessVaultState) {
        // No need to pass the private key from constructor. Can be derived when needed.
        super("");
        this.account = account;
        this.vault = vault;
    }

    async getPubKey(): Promise<string> {
        return Promise.resolve(this.account.keyInstance.publicKey);
    }

    protected async signRaw(msgHash: string): Promise<Signature> {
        const signingKey = await this.getSigningKey();
        return ec.starkCurve.sign(signingKey, msgHash);
    }

    private async getSigningKey(): Promise<string> {
        const result = await this.vault.requestAccess(
            { requestFor: "privateKeys", signing: [this.account], tokens: new Map() },
            {
                title: "Signing Transaction...",
                subtitleAndroid: `Authorize to sign transaction for ${this.account.address}`,
                descriptionAndroid: "KAGE needs your authentication to securely sign the transaction using your private keys.",
                cancelAndroid: "Cancel",
            }
        );

        const keyPairs = result.signing.get(this.account);

        if (!keyPairs) {
            throw new AppError("Signing key not found for account ", this.account.address);
        }

        return keyPairs.spendingKeyPair.privateSpendingKey;
    }
}