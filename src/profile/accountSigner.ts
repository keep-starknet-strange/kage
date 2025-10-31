import { AccessVaultState } from "@/stores/accessVaultStore";
import { deriveStarknetPrivateKey, joinMnemonicWords } from "@starkms/key-management";
import { ec, Signature, Signer } from "starknet";
import Account from "./account";
import HDKeyInstance from "./keyInstance";

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
        console.log("Signing raw message", msgHash);
        const signingKey = await this.getSigningKey();
        return ec.starkCurve.sign(signingKey, msgHash);
    }

    private async getSigningKey(): Promise<string> {
        if (this.account.keyInstance instanceof HDKeyInstance) {
            const keySourceId = this.account.keyInstance.keySourceId;
            const seedphrase = await this.vault.requestAccess({ requestFor: "seedphrase", keySourceId: keySourceId });

            const derivationArgs = {
                accountIndex: 0,
                addressIndex: this.account.keyInstance.index,
            }
            return deriveStarknetPrivateKey(derivationArgs, joinMnemonicWords(seedphrase));
        } else {
            throw new Error("Non HD derivation is not supported yet");
        }

    }
}