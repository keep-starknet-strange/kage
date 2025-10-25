import { constants } from "starknet";
import { NetworkId } from "../misc";
import { Type } from "class-transformer";

export default class NetworkDerfinition {
    @Type(() => URL)
    readonly rpcUrl: URL;
    readonly chainId: NetworkId;
    readonly accountClassHash: string;
    readonly feeTokenAddress: string;
    @Type(() => URL)
    readonly blockExplorerUrl: URL | null;

    constructor(
        rpcUrl: URL,
        chainId: NetworkId,
        accountClassHash: string,
        feeTokenAddress: string,
        blockExplorerUrl: URL | null
    ) {
        this.rpcUrl = rpcUrl;
        this.chainId = chainId;
        this.accountClassHash = accountClassHash;
        this.feeTokenAddress = feeTokenAddress;
        this.blockExplorerUrl = blockExplorerUrl;
    }

    static sepolia(rpcUrlString: string = process.env.RPC_SN_SEPOLIA): NetworkDerfinition {
        return new NetworkDerfinition(
            new URL(rpcUrlString),
            constants.StarknetChainId.SN_SEPOLIA,
            "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564",
            "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            new URL("https://sepolia.voyager.online/")
        );
    }

    static mainnet(rpcUrlString: string = process.env.RPC_SN_MAIN): NetworkDerfinition {
        return new NetworkDerfinition(
            new URL(rpcUrlString),
            constants.StarknetChainId.SN_MAIN,
            "0x01e60c8722677cfb7dd8dbea5be86c09265db02cdfe77113e77da7d44c017388",
            "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            new URL("https://voyager.online/")
        );
    }
}