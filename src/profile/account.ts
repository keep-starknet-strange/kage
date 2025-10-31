import { Type } from "class-transformer";
import HDKeyInstance, { KeyInstance } from "./keyInstance";
import { NetworkId } from "./misc";
import { RpcProvider, Account as StarknetAccount } from "starknet";
import { AccountSigner } from "./accountSigner";
import { AccessVaultState } from "@/stores/accessVaultStore";

export default class Account {

    readonly address: string;
    readonly name: string
    readonly networkId: NetworkId;

    @Type(() => KeyInstance, {
        discriminator: {
            property: "kind",
            subTypes: [
                { value: HDKeyInstance, name: "hdKeyInstance" }
            ]
        }
    })
    readonly keyInstance: KeyInstance;

    constructor(
        address: string,
        name: string,
        networkId: NetworkId,
        keyInstance: KeyInstance
    ) {
        this.address = address;
        this.name = name;
        this.networkId = networkId;
        this.keyInstance = keyInstance;
    }

    toStarknetAccount(vault: AccessVaultState, provider: RpcProvider): StarknetAccount {
        return new StarknetAccount({
            provider: provider,
            address: this.address,
            signer: new AccountSigner(this, vault),
        });
    }
}