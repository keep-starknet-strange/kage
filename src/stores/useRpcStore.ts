import { NetworkId } from "@/profile/misc";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { AppError } from "@/types/appError";
import i18n from "@/utils/i18n";
import { LOG } from "@/utils/logs";
import { RpcProvider, WebSocketChannel } from "starknet";
import { create } from "zustand";

export interface RpcState {
    networkId: NetworkId | null;
    providerUrl: URL | null;
    wsChannelUrl: URL | null;

    provider: RpcProvider | null;
    wsChannel: WebSocketChannel | null;

    setNetwork: (network: NetworkDefinition) => RpcProvider;
    getProvider: () => RpcProvider;
    subscribeToWS: () => Promise<WebSocketChannel>;
    unsubscribeFromWS: () => Promise<void>;

    reset: () => Promise<void>;
}

export const useRpcStore = create<RpcState>((set, get) => {
    return {
        networkId: null,
        providerUrl: null,
        wsChannelUrl: null,

        provider: null,
        wsChannel: null,

        setNetwork: (network: NetworkDefinition) => {
            const { networkId, provider } = get();

            if (networkId === network.chainId) {
                if (provider === null) {
                    throw new AppError(i18n.t('errors.providerNotSet'));
                }

                return provider;
            }

            LOG.info("SET RPC to", network.chainId);
            const newProvider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 })

            set({
                networkId: network.chainId,
                providerUrl: network.rpcUrl,
                wsChannelUrl: network.wsUrl,
                provider: newProvider,
                wsChannel: null,
            });

            return newProvider;
        },
        getProvider: () => {
            const { provider } = get();
            if (provider === null) {
                throw new AppError(i18n.t('errors.providerNotSet'));
            }
            return provider;
        },
        subscribeToWS: async () => {
            const { wsChannel, wsChannelUrl } = get();

            if (wsChannelUrl === null) {
                throw new AppError(i18n.t('errors.websocketUrlNotSet'));
            }

            const resultChannel = wsChannel ?? new WebSocketChannel({ nodeUrl: wsChannelUrl.toString(), autoReconnect: false });

            LOG.info(`📣 Connecting to ${wsChannelUrl.toString()}...`);
            await resultChannel.waitForConnection();
            LOG.info("✅ Connected");

            set({
                wsChannel: resultChannel,
            });
            
            return resultChannel;
        },
        unsubscribeFromWS: async () => {
            const { wsChannel } = get();

            if (wsChannel !== null && wsChannel.isConnected()) {
                LOG.info("🛑 Disconnecting...");
                wsChannel.disconnect();
                await wsChannel.waitForDisconnection();
                LOG.info("🛑 Disconnected");

                set({
                    wsChannel: null,
                });
            }
        },

        reset: async () => {
            const { unsubscribeFromWS } = get();
            await unsubscribeFromWS();

            set({
                networkId: null,
                providerUrl: null,
                wsChannelUrl: null,
                provider: null,
                wsChannel: null,
            });

        }
    }
});