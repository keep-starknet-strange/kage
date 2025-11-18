import { Type } from "class-transformer";
import Account, { AccountAddress } from "./account";
import { NetworkId } from "./misc";
import { KeySourceId } from "./keys/keySource";
import HDKeyInstance from "./keyInstance";
import { deriveAccountAddress, deriveStarknetKeyPairs, getStarknetPublicKeyFromPrivate, joinMnemonicWords, StarknetKeyPair } from "@starkms/key-management";

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

        const keyPair = deriveStarknetKeyPairs({
            accountIndex: 0,
            addressIndex: newIndex, // TODO check that with Teddy
        }, joinMnemonicWords(seedPhraseWords), true)

        const publicKey = getStarknetPublicKeyFromPrivate(keyPair.spendingKeyPair.privateSpendingKey, true);
        const accountAddress = deriveAccountAddress(
            publicKey,
            { classHash: accountClassHash, salt: "0x0" }
        ).address;

        return this.addAccounts([{
            accountAddress: AccountAddress.fromHex(accountAddress), 
            accountName, 
            index: newIndex, 
            keySourceId, 
            keyPair
        }]);
    }

    addAccounts(
        accountData: {
            accountAddress: AccountAddress,
            accountName: string,
            index: number,
            keySourceId: KeySourceId,
            keyPair: StarknetKeyPair
        }[]
    ): Network {
        const newAccounts: Account[] = [...this.accounts];
        for (const data of accountData) {
            const publicKey = getStarknetPublicKeyFromPrivate(data.keyPair.spendingKeyPair.privateSpendingKey, true);
            const keyInstance = new HDKeyInstance(data.keySourceId, publicKey, data.index);
            const newAccount = new Account(data.accountAddress, data.accountName, this.networkId, keyInstance);
            newAccounts.push(newAccount);
        }
        return new Network(this.networkId, newAccounts);
    }

    updateAccounts(updatedAccounts: Account[]): Network {
        return new Network(this.networkId, updatedAccounts);
    }

    static createEmpty(networkId: NetworkId): Network {
        return new Network(networkId, [])
    }
}