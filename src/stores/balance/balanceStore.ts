import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import tokensConfig from "res/config/tokens.json";
import { create } from "zustand";
import PrivateBalanceRepository from "./privateBalanceRepository";
import { PublicBalanceRepository } from "./publicBalanceRepository";
import Token from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { useAccessVaultStore } from "../accessVaultStore";
import { RpcProvider } from "starknet";

type PresetNetworkId = keyof typeof tokensConfig;

export interface BalanceState {
    networkId: NetworkId;
    tokens: ReadonlyMap<string, Token>;
    unlockedPrivateBalances: Set<AccountAddress>;
    privateBalanceRepository: PrivateBalanceRepository;
    publicBalanceRepository: PublicBalanceRepository;

    publicBalances: ReadonlyMap<AccountAddress, PublicTokenBalance[]>,
    privateBalances: ReadonlyMap<AccountAddress, PrivateTokenBalance[]>,

    changeNetwork: (networkId: NetworkId, rpcProvider: RpcProvider, accounts: Account[]) => Promise<void>,
    requestRefresh: (accounts: Account[]) => Promise<void>,
    unlockPrivateBalances: (accounts: Account[]) => Promise<void>,
    lockPrivateBalances: (accounts: Account[]) => Promise<void>,
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
    networkId: "SN_MAIN",
    tokens: new Map(tokensConfig.SN_MAIN.map((token) => [token.erc20, new Token(token.erc20, token.tongo, token.symbol, token.decimals)])),
    unlockedPrivateBalances: new Set(),
    privateBalanceRepository: new PrivateBalanceRepository(),
    publicBalanceRepository: new PublicBalanceRepository(),
    publicBalances: new Map(),
    privateBalances: new Map(),

    changeNetwork: async (networkId: NetworkId, rpcProvider: RpcProvider, accounts: Account[]) => {
        if (get().networkId === networkId) {
            return;
        }

        get().privateBalanceRepository.setNetwork(networkId, rpcProvider);
        get().publicBalanceRepository.setNetwork(networkId, rpcProvider);

        const presetExists = Object.prototype.hasOwnProperty.call(tokensConfig, networkId);
        let tokens: Token[];
        if (presetExists) {
            tokens = tokensConfig[networkId as PresetNetworkId].map((token) => {
                return new Token(token.erc20, token.tongo, token.symbol, token.decimals)
            });
        } else {
            tokens = [];
        }

        set({
            networkId: networkId,
            tokens: new Map(tokens.map((token) => [token.contractAddress, token])),
            publicBalances: new Map(),
            privateBalances: new Map()
        });

        await get().requestRefresh(accounts);
    },

    requestRefresh: async (accounts: Account[]) => {
        const {publicBalanceRepository, privateBalanceRepository, tokens} = get();

        const tokensToFetch = Array.from(tokens.values());
        await Promise.all([
            publicBalanceRepository.getBalances(accounts, tokensToFetch),
            privateBalanceRepository.getBalances(accounts, tokensToFetch)
        ]).then(([publicBalances, privateBalances]) => {
            set({ publicBalances, privateBalances });
        }).catch((error) => {
            console.error('Error refreshing balances:', error);
        });
    },

    unlockPrivateBalances: async (accounts: Account[]) => {
        const {privateBalanceRepository, tokens, requestRefresh} = get();
        const {requestAccess} = useAccessVaultStore.getState();

        try {
            await privateBalanceRepository.unlock(accounts, Array.from(tokens.values()), requestAccess);
            set({ unlockedPrivateBalances: new Set(accounts.map((account) => account.address)) });
        } catch (error) {
            console.error('Error unlocking private balances:', error);
        }

        await requestRefresh(accounts);
    },
    lockPrivateBalances: async (accounts: Account[]) => {
        const {privateBalanceRepository, tokens, requestRefresh} = get();
        await privateBalanceRepository.lock(accounts, Array.from(tokens.values()));
        set({ unlockedPrivateBalances: new Set() });
        await requestRefresh(accounts);
    }
}));