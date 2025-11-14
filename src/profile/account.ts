import { AccessVaultState } from "@/stores/accessVaultStore";
import Identifiable from "@/types/Identifiable";
import { Type } from "class-transformer";
import { RpcProvider, Account as StarknetAccount } from "starknet";
import { AccountSigner } from "./accountSigner";
import HDKeyInstance, { KeyInstance } from "./keyInstance";
import { NetworkId } from "./misc";
import { AppError } from "@/types/appError";

export type AccountAddress = string & {
    __type: "account";
}

export namespace AccountAddress {
    export function fromHex(hex: string): AccountAddress {
        // Validate hex format
        if (!hex.startsWith('0x')) {
            throw new AppError(`Invalid account address: must start with 0x`, hex);
        }
        
        // Validate hex characters (case-insensitive) and length
        const hexPart = hex.slice(2);
        if (hexPart.length === 0) {
            throw new AppError(`Invalid account address: missing hex digits after 0x`, hex);
        }
        
        if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
            throw new AppError(`Invalid account address: contains non-hex characters`, hex);
        }
        
        // Starknet addresses can be up to 64 hex characters (256 bits) but can be shorter
        if (hexPart.length > 64) {
            throw new AppError(`Invalid account address: too long (max 64 hex characters)`, hex);
        }
        
        // Pad with leading zeros to 64 characters and normalize to lowercase
        const paddedHex = hexPart.padStart(64, '0');
        return `0x${paddedHex}`.toLowerCase() as AccountAddress;
    }

    export function fromHexOrNull(hex: string): AccountAddress | null {
        try {
            return AccountAddress.fromHex(hex);
        } catch (error) {
            return null;
        }
    }

    export function correlate(address1: AccountAddress, address2: AccountAddress): boolean {
        return address1.toLowerCase() === address2.toLowerCase();
    }
}

export default class Account implements Identifiable {
    readonly address: AccountAddress;
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
        address: AccountAddress,
        name: string,
        networkId: NetworkId,
        keyInstance: KeyInstance
    ) {
        this.address = address;
        this.name = name;
        this.networkId = networkId;
        this.keyInstance = keyInstance;
    }

    get id(): string {
        return this.networkId + "." + this.address;
    }

    toStarknetAccount(vault: AccessVaultState, provider: RpcProvider): StarknetAccount {
        return new StarknetAccount({
            provider: provider,
            address: this.address,
            signer: new AccountSigner(this, vault),
        });
    }

    updateName(newName: string): Account {
        return new Account(this.address, newName, this.networkId, this.keyInstance);
    }
}