import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { LOG } from "@/utils/logs";
import { RpcProvider, WebSocketChannel } from "starknet";
import { create } from "zustand";

export interface RpcState {
    networkId: NetworkId;
    provider: RpcProvider;
    wsChannel: WebSocketChannel;

    changeNetwork: (network: NetworkDerfinition) => Promise<RpcProvider>;
}

export const useRpcStore = create<RpcState>((set, get) => {
    const mainnet = NetworkDerfinition.mainnet()
    const initialWsChannel = new WebSocketChannel({ nodeUrl: mainnet.wsUrl.toString() });

    return {
        networkId: "SN_MAIN",
        provider: new RpcProvider({ nodeUrl: mainnet.rpcUrl.toString(), batch: 0 }),
        wsChannel: initialWsChannel,

        changeNetwork: async (network: NetworkDerfinition) => {
            const { networkId, wsChannel, provider } = get();

            if (networkId === network.chainId) {
                return provider;
            }

            LOG.info("Change RPC network to", network.chainId);
            
            const newProvider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 })
            const newWsChannel = new WebSocketChannel({ nodeUrl: network.wsUrl.toString() })

            set({
                networkId: network.chainId,
                provider: newProvider,
                wsChannel: newWsChannel,
            });

            return newProvider;
        },
    }
});