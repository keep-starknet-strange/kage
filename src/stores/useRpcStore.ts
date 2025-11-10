import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { RpcProvider, WebSocketChannel } from "starknet";
import { create } from "zustand";

export interface RpcState {
    networkId: NetworkId;
    provider: RpcProvider;
    wsChannel: WebSocketChannel;

    changeNetwork: (network: NetworkDerfinition) => RpcProvider;
}

export const useRpcStore = create<RpcState>((set, get) => {
    const mainnet = NetworkDerfinition.mainnet()

    return {
        networkId: "SN_MAIN",
        provider: new RpcProvider({ nodeUrl: mainnet.rpcUrl.toString(), batch: 0 }),
        wsChannel: new WebSocketChannel({ nodeUrl: mainnet.wsUrl.toString() }),

        changeNetwork: (network: NetworkDerfinition) => {
            const { wsChannel } = get();
            const provider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 });

            if (wsChannel.isConnected()) {
                wsChannel.disconnect();
            }

            set({
                networkId: network.chainId,
                provider: provider,
                wsChannel: new WebSocketChannel({ nodeUrl: network.wsUrl.toString() }),
            });
            return provider;
        },
    }
});