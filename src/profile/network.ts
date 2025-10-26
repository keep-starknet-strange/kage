import { Type } from "class-transformer";
import Account from "./account";
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

    static createEmpty(networkId: NetworkId): Network {
        return new Network(networkId, [])
    }
}