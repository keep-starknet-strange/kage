import { NetworkId } from "@/profile/misc";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { LOG } from "@/utils/logs";
import { RpcProvider, WebSocketChannel } from "starknet";
import { create } from "zustand";

export interface RpcState {
    networkId: NetworkId;
    provider: RpcProvider;
    wsChannel: WebSocketChannel;

    changeNetwork: (network: NetworkDefinition) => Promise<RpcProvider>;
    subscribeToWS: () => Promise<WebSocketChannel>;
    unsubscribeFromWS: () => void;

    reset: () => Promise<void>;
}

export const useRpcStore = create<RpcState>((set, get) => {
    const mainnet = NetworkDefinition.mainnet()
    const initialWsChannel = new WebSocketChannel({ nodeUrl: mainnet.wsUrl.toString() });

    return {
        networkId: "SN_MAIN",
        provider: new RpcProvider({ nodeUrl: mainnet.rpcUrl.toString(), batch: 0 }),
        wsChannel: initialWsChannel,

        changeNetwork: async (network: NetworkDefinition) => {
            const { networkId, provider } = get();

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
        subscribeToWS: async () => {
            const { wsChannel } = get();

            LOG.info("📣 Connecting...");
            await wsChannel.waitForConnection();
            LOG.info("✅ Connected");

            return wsChannel;
        },
        unsubscribeFromWS: async () => {
            const { wsChannel } = get();

            set({
                wsChannel: new WebSocketChannel({ nodeUrl: wsChannel.nodeUrl }),
            });

            if (wsChannel.isConnected()) {
                LOG.info("🛑 Disconnecting...");
                wsChannel.disconnect();
                LOG.info("🛑 Disconnected");
            }
        },

        reset: async () => {
            const { unsubscribeFromWS } = get();
            await unsubscribeFromWS();
            
            set({
                networkId: "SN_MAIN",
                provider: new RpcProvider({ nodeUrl: mainnet.rpcUrl.toString(), batch: 0 }),
                wsChannel: new WebSocketChannel({ nodeUrl: mainnet.wsUrl.toString() }),
            });
            
        }
    }
});