import { Type } from "class-transformer";
import { NetworkId } from "../misc";
import NetworkDerfinition from "./networkDefinition";
import { AppError } from "@/types/appError";

export default class NetworkSettings {
    readonly current: NetworkId;

    @Type(() => NetworkDerfinition)
    readonly definitions: NetworkDerfinition[];

    constructor(
        current: NetworkId,
        definitions: NetworkDerfinition[]
    ) {
        this.current = current;
        this.definitions = definitions;

        // TODO for some reason class-transformer does not provide those definitions when deserializing JSON.
        // if (this.definitions
        //     .filter(definition => definition.chainId === "SN_MAIN" || definition.chainId === "SN_SEPOLIA")
        //     .length < 2) {
        //     throw new Error("NetworkSettings must at least contain SN_MAIN and SN_SEPOLIA definitions.");
        // }
    }

    addNetwork(definition: NetworkDerfinition): NetworkSettings {
        if (this.definitions.some(def => def.chainId === definition.chainId)) {
            throw new AppError(`NetworkSettings already contains a definition for chain ${definition.chainId}.`);
        }

        return new NetworkSettings(
            this.current,
            [...this.definitions, definition]
        );
    }

    updateCurrentNetwork(network: NetworkId): NetworkSettings {
        if (!this.definitions.some(def => def.chainId === network)) {
            throw new AppError(`NetworkSettings does not contain a definition for chain ${network}.`);
        }

        return new NetworkSettings(
            network,
            this.definitions
        );
    }

    get currentNetworkDefinition(): NetworkDerfinition {
        const currentDefinition = this.definitions.find((definition) => definition.chainId == this.current)
        if (!currentDefinition) {
            throw new AppError(`Network ${this.current} is not yet defined.`)
        }

        return currentDefinition;
    }

    static default(): NetworkSettings {
        return new NetworkSettings(
            "SN_SEPOLIA",
            [NetworkDerfinition.mainnet(), NetworkDerfinition.sepolia()]
        );
    }
}