import { AccessVaultState } from "@/stores/accessVaultStore";
import { AppError } from "@/types/appError";
import i18n from "@/utils/i18n";
import { ec, Signature, Signer } from "starknet";
import Account from "./account";

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
                title: i18n.t('biometricPrompts.signingTransaction.title'),
                subtitleAndroid: `Authorize to sign transaction for ${this.account.address}`,
                descriptionAndroid: "KAGE needs your authentication to securely sign the transaction using your private keys.",
                cancelAndroid: i18n.t('biometricPrompts.signingTransaction.cancelAndroid'),
            }
        );

        const keyPair = result.signing.get(this.account);

        if (!keyPair) {
            throw new AppError(i18n.t('errors.signingKeyNotFound'), this.account.address);
        }

        return keyPair.privateKey;
    }
}