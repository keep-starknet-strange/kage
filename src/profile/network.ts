import { Type } from "class-transformer";
import Account, { AccountAddress } from "./account";
import { NetworkId } from "./misc";
import { KeySourceId } from "./keys/keySource";
import HDKeyInstance from "./keyInstance";
import { deriveAccountAddress, deriveStarknetKeyPairs, getStarknetPublicKeyFromPrivate, joinMnemonicWords } from "@starkms/key-management";

export default class Network {
    readonly networkId: NetworkId;

    @Type(() => Account)
    readonly accounts: readonly Account[]

    constructor(
        networkId: NetworkId,
        accounts: Account[]
    ) {
        this.networkId = networkId;
        this.accounts = accounts;
    }

    nextAccountIndex(keySourceId: KeySourceId): number {
        return Math.max(
            ...this.accounts
                .filter(account => account.keyInstance.keySourceId === keySourceId)
                .map(account => (account.keyInstance as HDKeyInstance).index),  
            -1
        ) + 1;
    }

    addNewAccount(
        accountName: string,
        accountClassHash: string,
        seedPhraseWords: string[]
    ): Network {
        const keySourceId = KeySourceId.from(seedPhraseWords);
        const newIndex = this.nextAccountIndex(keySourceId);

        const keyPairs = deriveStarknetKeyPairs({
            accountIndex: 0,
            addressIndex: newIndex, // TODO check that with Teddy
        }, joinMnemonicWords(seedPhraseWords), true)

        const publicKey = getStarknetPublicKeyFromPrivate(keyPairs.spendingKeyPair.privateSpendingKey, true);
        const accountAddress = deriveAccountAddress(
            publicKey,
            { classHash: accountClassHash, salt: "0x0" }
        ).address;

        const keyInstance = new HDKeyInstance(keySourceId, publicKey, newIndex);
        const newAccount = new Account(AccountAddress.fromHex(accountAddress), accountName, this.networkId, keyInstance);

        const newAccounts = [...this.accounts, newAccount];

        return new Network(this.networkId, newAccounts);
    }

    updateAccounts(updatedAccounts: Account[]): Network {
        return new Network(this.networkId, updatedAccounts);
    }

    static createEmpty(networkId: NetworkId): Network {
        return new Network(networkId, [])
    }
}