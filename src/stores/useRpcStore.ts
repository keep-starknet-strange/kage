import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { RpcProvider } from "starknet";
import { create } from "zustand";

export interface RpcState {
    networkId: NetworkId;
    provider: RpcProvider;

    changeNetwork: (network: NetworkDerfinition) => RpcProvider;
}

export const useRpcStore = create<RpcState>((set) => ({
    networkId: "SN_MAIN",
    provider: new RpcProvider({ nodeUrl: NetworkDerfinition.mainnet().rpcUrl.toString(), batch: 0 }),

    changeNetwork: (network: NetworkDerfinition) => {
        const provider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 });
        set({
            networkId: network.chainId,
            provider: provider
        });
        return provider;
    },
}));