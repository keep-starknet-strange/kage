import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import Token from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import tokensConfig from "res/config/tokens.json";
import { RpcProvider } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "../accessVaultStore";
import PrivateBalanceRepository from "./privateBalanceRepository";
import { PublicBalanceRepository } from "./publicBalanceRepository";

type PresetNetworkId = keyof typeof tokensConfig;

export interface BalanceState {
    networkId: NetworkId;
    tokens: ReadonlyMap<string, Token>;
    feeToken: Token;
    unlockedPrivateBalances: Set<AccountAddress>;
    privateBalanceRepository: PrivateBalanceRepository;
    publicBalanceRepository: PublicBalanceRepository;

    publicBalances: ReadonlyMap<AccountAddress, PublicTokenBalance[]>,
    privateBalances: ReadonlyMap<AccountAddress, PrivateTokenBalance[]>,

    changeNetwork: (networkId: NetworkId, rpcProvider: RpcProvider, accounts: Account[]) => Promise<void>,
    requestRefresh: (accounts: Account[]) => Promise<void>,
    updateBalances: (
        publicBalances: Map<Account, Token[]>,
        privateBalances: Map<Account, Token[]>
    ) => void,
    unlockPrivateBalances: (accounts: Account[]) => Promise<void>,
    lockPrivateBalances: (accounts: Account[]) => Promise<void>,
}

export const useBalanceStore = create<BalanceState>((set, get) => {
    
    const mainnetTokens = new Map(tokensConfig.SN_MAIN.tokens.map((token) => [token.erc20, new Token(token.erc20, token.tongo, token.symbol, token.decimals)]));
    const mainnetFeeToken = mainnetTokens.get(tokensConfig.SN_MAIN.feeTokenAddress);
    if (!mainnetFeeToken) {
        throw new Error("Fee token not found for mainnet. Make sure tokens.json is configured properly.");
    }

    return {
        networkId: "SN_MAIN",
        tokens: mainnetTokens,
        feeToken: mainnetFeeToken,
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
            let tokens: Map<string, Token>;
            let feeToken: Token;
            if (presetExists) {
                const preset = tokensConfig[networkId as PresetNetworkId];
                tokens = new Map(preset.tokens.map((token) => {
                    return [token.erc20, new Token(token.erc20, token.tongo, token.symbol, token.decimals)]
                }));
                if (!tokens.has(preset.feeTokenAddress)) {
                    throw new Error("Fee token not found for network " + networkId + ". Make sure tokens.json is configured properly.");
                }

                feeToken = tokens.get(preset.feeTokenAddress)!;
            } else {
                throw new Error("Network " + networkId + " is not configured in tokens.json. Dynamic presets not supported yet.");
            }

            set({
                networkId: networkId,
                tokens: tokens,
                feeToken: feeToken,
                publicBalances: new Map(),
                privateBalances: new Map()
            });

            await get().requestRefresh(accounts);
        },

        requestRefresh: async (accounts: Account[]) => {
            const { publicBalanceRepository, privateBalanceRepository, tokens } = get();

            const tokensToFetch = Array.from(tokens.values());
            const accountsToFetch = new Map(accounts.map((account) => [account, tokensToFetch]));
            await Promise.all([
                publicBalanceRepository.getBalances(accountsToFetch),
                privateBalanceRepository.getBalances(accountsToFetch)
            ]).then(([publicBalances, privateBalances]) => {
                set({ publicBalances, privateBalances });
            }).catch((error) => {
                console.error('Error refreshing balances:', error);
            });
        },

        updateBalances: async (publicBalances: Map<Account, Token[]>, privateBalances: Map<Account, Token[]>) => {
            const { publicBalanceRepository, privateBalanceRepository } = get();

            await Promise.all([
                publicBalanceRepository.getBalances(publicBalances),
                privateBalanceRepository.getBalances(privateBalances)
            ]).then(([updatedPublicAccountBalances, updatedPrivateAccountBalances]) => {
                set((state) => {
                    const currentPublicAccountBalances = new Map(state.publicBalances);
                    const currentPrivateAccountBalances = new Map(state.privateBalances);

                    for (const [account, updatedPublicTokenBalances] of updatedPublicAccountBalances.entries()) {
                        const currentTokenBalances = currentPublicAccountBalances.get(account) ?? [];
                        const updated = currentTokenBalances.map((b) => {
                            return updatedPublicTokenBalances.find((t) => t.id === b.id) ?? b;
                        });
                        currentPublicAccountBalances.set(account, updated);
                    }

                    for (const [account, updatedPrivateTokenBalances] of updatedPrivateAccountBalances.entries()) {
                        const currentTokenBalances = currentPrivateAccountBalances.get(account) ?? [];
                        const updated = currentTokenBalances.map((b) => {
                            return updatedPrivateTokenBalances.find((t) => t.id === b.id) ?? b;
                        });
                        currentPrivateAccountBalances.set(account, updated);
                    }

                    return {
                        publicBalances: currentPublicAccountBalances,
                        privateBalances: currentPrivateAccountBalances
                    };
                });
            }).catch((error) => {
                console.error('Error refreshing balances:', error);
            });
        },

        unlockPrivateBalances: async (accounts: Account[]) => {
            const { privateBalanceRepository, tokens, requestRefresh } = get();
            const { requestAccess } = useAccessVaultStore.getState();

            try {
                await privateBalanceRepository.unlock(accounts, Array.from(tokens.values()), requestAccess);
                set({ unlockedPrivateBalances: new Set(accounts.map((account) => account.address)) });
            } catch (error) {
                console.error('Error unlocking private balances:', error);
            }

            await requestRefresh(accounts);
        },
        lockPrivateBalances: async (accounts: Account[]) => {
            const { privateBalanceRepository, tokens, requestRefresh } = get();
            await privateBalanceRepository.lock(accounts, Array.from(tokens.values()));
            set({ unlockedPrivateBalances: new Set() });
            await requestRefresh(accounts);
        }
    }
});