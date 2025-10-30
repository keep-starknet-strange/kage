import { Type } from "class-transformer";
import { NetworkId } from "./misc";
import HDKeyInstance, { KeyInstance } from "./keyInstance";

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
}