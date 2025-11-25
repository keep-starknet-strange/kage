import { KeyPair, kmsProvider } from "@/crypto/kms/KMSProvider";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { Type } from "class-transformer";
import Account, { AccountAddress } from "./account";
import HDKeyInstance from "./keyInstance";
import { KeySourceId } from "./keys/keySource";
import { NetworkId } from "./misc";

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
        seedPhrase: SeedPhraseWords
    ): Network {
        const keySourceId = KeySourceId.from(seedPhrase);
        const newIndex = this.nextAccountIndex(keySourceId);

        const keyPair = kmsProvider.deriveKeyPair({
            type: "account-key-pair",
            accountIndex: newIndex,
        }, seedPhrase);

        const accountAddress = kmsProvider.deriveAccountAddress(
            keyPair.publicKey, 
            accountClassHash, 
            "0x0"
        );

        return this.addAccounts([{
            accountAddress, 
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
            keyPair: KeyPair
        }[]
    ): Network {
        const newAccounts: Account[] = [...this.accounts];
        for (const data of accountData) {
            // TODO Check that
            const publicKey = data.keyPair.publicKey;
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