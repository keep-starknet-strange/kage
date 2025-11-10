import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import Token from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { LOG } from "@/utils/logs";
import tokensConfig from "res/config/tokens.json";
import { hash, num, RpcProvider, SubscriptionStarknetEventsEvent } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "../accessVaultStore";
import { useRpcStore } from "../useRpcStore";
import PrivateBalanceRepository from "./privateBalanceRepository";
import { PublicBalanceRepository } from "./publicBalanceRepository";
import { MapUtils } from "@/utils/map";
import { pubKeyAffineToBase58, pubKeyFromData } from "@/utils/fatSolutions";
import { PrivateTokenAddress } from "@/types/privateRecipient";
import { TongoAddress } from "@fatsolutions/tongo-sdk/dist/types";

type PresetNetworkId = keyof typeof tokensConfig;

export interface BalanceState {
    networkId: NetworkId;
    unlockedPrivateBalances: Set<AccountAddress>;

    publicBalances: ReadonlyMap<AccountAddress, PublicTokenBalance[]>,
    privateBalances: ReadonlyMap<AccountAddress, PrivateTokenBalance[]>,

    changeNetwork: (networkId: NetworkId, rpcProvider: RpcProvider) => Promise<void>,
    requestRefresh: (publicBalancesFor: Account[], privateBalancesFor: Account[]) => Promise<void>,
    unlockPrivateBalances: (accounts: Account[]) => Promise<void>,
    lockPrivateBalances: (accounts: Account[]) => Promise<void>,

    subscribeToBalanceUpdates: (accounts: Account[]) => Promise<void>,
    unsubscribeFromBalanceUpdates: () => Promise<void>,
}

export const useBalanceStore = create<BalanceState>((set, get) => {

    const mainnetTokens = new Map(tokensConfig.SN_MAIN.tokens.map((token) => [token.erc20, new Token(token.erc20, token.tongo, token.symbol, token.decimals)]));

    const privateBalanceRepository = new PrivateBalanceRepository();
    const publicBalanceRepository = new PublicBalanceRepository();
    let networkTokens = mainnetTokens;

    const accountsSubscribedToBalanceUpdates = new Set<AccountAddress>();
    const publicTokenSubscriptions = new Map<string, SubscriptionStarknetEventsEvent>();
    const privateTokenSubscriptions = new Map<string, SubscriptionStarknetEventsEvent>();

    const updateBalancesWithTokens = async (
        publicBalances: Map<Account, Token[]>,
        privateBalances: Map<Account, Token[]>
    ) => await Promise.all([
        publicBalanceRepository.getBalances(publicBalances),
        privateBalanceRepository.getBalances(privateBalances)
    ]).then(([updatedPublicAccountBalances, updatedPrivateAccountBalances]) => {
        set((state) => {
            const currentPublicAccountBalances = new Map(state.publicBalances);
            const currentPrivateAccountBalances = new Map(state.privateBalances);

            for (const [account, updatedPublicTokenBalances] of updatedPublicAccountBalances.entries()) {
                for (const tokenBalance of updatedPublicTokenBalances) {
                    MapUtils.update(currentPublicAccountBalances, account, tokenBalance);
                }
            }

            for (const [account, updatedPrivateTokenBalances] of updatedPrivateAccountBalances.entries()) {
                for (const tokenBalance of updatedPrivateTokenBalances) {
                    MapUtils.update(currentPrivateAccountBalances, account, tokenBalance);
                }
            }


            return {
                publicBalances: currentPublicAccountBalances,
                privateBalances: currentPrivateAccountBalances
            };
        });
    })

    return {
        networkId: "SN_MAIN",
        unlockedPrivateBalances: new Set(),
        publicBalances: new Map(),
        privateBalances: new Map(),

        subscriptions: new Map(),

        changeNetwork: async (networkId: NetworkId, rpcProvider: RpcProvider) => {
            const { networkId: currentNetworkId } = get();

            if (currentNetworkId === networkId) {
                return;
            }
            
            LOG.info("Changing balance network to", networkId);

            privateBalanceRepository.setNetwork(networkId, rpcProvider);
            publicBalanceRepository.setNetwork(networkId, rpcProvider);

            const presetExists = Object.prototype.hasOwnProperty.call(tokensConfig, networkId);
            let tokens: Map<string, Token>;
            if (presetExists) {
                const preset = tokensConfig[networkId as PresetNetworkId];
                tokens = new Map(preset.tokens.map((token) => {
                    return [token.erc20, new Token(token.erc20, token.tongo, token.symbol, token.decimals)]
                }));
                if (!tokens.has(preset.feeTokenAddress)) {
                    throw new Error("Fee token not found for network " + networkId + ". Make sure tokens.json is configured properly.");
                }
            } else {
                throw new Error("Network " + networkId + " is not configured in tokens.json. Dynamic presets not supported yet.");
            }

            networkTokens = tokens
            set({
                networkId: networkId,
                publicBalances: new Map(),
                privateBalances: new Map()
            });
        },

        requestRefresh: async (publicBalancesFor: Account[], privateBalancesFor: Account[]) => {
            const tokensToFetch = Array.from(networkTokens.values());
            const publicAccountTokens = new Map(publicBalancesFor.map((account) => [account, tokensToFetch]));
            const privateAccountTokens = new Map(privateBalancesFor.map((account) => [account, tokensToFetch]));
            await updateBalancesWithTokens(publicAccountTokens, privateAccountTokens);
        },

        unlockPrivateBalances: async (accounts: Account[]) => {
            const { requestAccess } = useAccessVaultStore.getState();
            const { requestRefresh } = get()

            const allTokens = Array.from(networkTokens.values());

            await privateBalanceRepository.unlock(accounts, allTokens, requestAccess);
            set({ unlockedPrivateBalances: new Set(accounts.map((account) => account.address)) });
            await requestRefresh([], accounts);
        },
        lockPrivateBalances: async (accounts: Account[]) => {
            const { requestRefresh } = get();
            await privateBalanceRepository.lock(accounts, Array.from(networkTokens.values()));
            set({ unlockedPrivateBalances: new Set() });
            await requestRefresh([], accounts);
        },

        subscribeToBalanceUpdates: async (accounts: Account[]) => {
            const remainingAccounts = accounts.filter((account) => !accountsSubscribedToBalanceUpdates.has(account.address));
            if (remainingAccounts.length === 0) {
                return;
            }

            LOG.info("Listening for:", remainingAccounts.map((account) => account.name).join(", "));
            remainingAccounts.forEach((account) => accountsSubscribedToBalanceUpdates.add(account.address));

            const tokens = Array.from(networkTokens.values());
            const { wsChannel } = useRpcStore.getState();

            // Ensure WebSocket is connected before subscribing
            if (!wsChannel.isConnected()) {
                LOG.info("📣 WebSocket not connected, waiting for connection...");
                await wsChannel.waitForConnection();
                LOG.info("📣 WebSocket connected, proceeding with subscriptions");
            }

            const accountAddresses = new Map(remainingAccounts.map((account) => [account.address, account]));

            const transferEventKey = num.toHex(hash.starknetKeccak('Transfer'));

            const privateFundEventKey = num.toHex(hash.starknetKeccak('FundEvent'));
            const privateTransferEventKey = num.toHex(hash.starknetKeccak('TransferEvent'));
            const privateWithdrawEventKey = num.toHex(hash.starknetKeccak('WithdrawEvent'));

            for (const token of tokens) {
                const publicTokenSubscription = await wsChannel.subscribeEvents({
                    fromAddress: token.contractAddress,
                    keys: [
                        [transferEventKey],
                    ]
                });
                publicTokenSubscriptions.set(token.contractAddress, publicTokenSubscription);

                const privateTokenSubscription = await wsChannel.subscribeEvents({
                    fromAddress: token.tongoAddress,
                    keys: [
                        [privateFundEventKey, privateTransferEventKey, privateWithdrawEventKey],
                    ]
                });
                privateTokenSubscriptions.set(token.tongoAddress, privateTokenSubscription);
            }

            // Track pairs of accounts + tokens that need update
            const publicBalancesNeedingUpdate = new Map<Account, Token[]>();
            const privateBalancesNeedingUpdate = new Map<Account, Token[]>();
            let debounceTimer: NodeJS.Timeout | null = null;
            let isUpdating = false;

            const processUpdate = async () => {
                // Prevent concurrent updates
                if (isUpdating) {
                    return;
                }

                if (publicBalancesNeedingUpdate.size === 0 && privateBalancesNeedingUpdate.size === 0) {
                    return;
                }

                isUpdating = true;

                // Snapshot the current state and clear maps immediately
                const publicBalancesToUpdate = new Map(publicBalancesNeedingUpdate);
                const privateBalancesToUpdate = new Map(privateBalancesNeedingUpdate);

                // Clear the maps so new events can accumulate
                publicBalancesNeedingUpdate.clear();
                privateBalancesNeedingUpdate.clear();

                try {
                    await updateBalancesWithTokens(publicBalancesToUpdate, privateBalancesToUpdate);
                } catch (error) {
                    console.error('Error in processUpdate:', error);
                } finally {
                    isUpdating = false;

                    // Check if new updates arrived while we were processing
                    if (publicBalancesNeedingUpdate.size > 0 || privateBalancesNeedingUpdate.size > 0) {
                        // Schedule another update for the queued changes
                        triggerUpdate();
                    }
                }
            };

            const triggerUpdate = () => {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(() => {
                    processUpdate();
                }, 1000); // 1 second debounce
            };

            Array.from(publicTokenSubscriptions.entries()).forEach(([address, subscription]) => {
                subscription.on((data) => {
                    const token = tokens.find((t) => t.contractAddress === address);
                    if (!token) {
                        return;
                    }

                    const fromAccount = accountAddresses.get(data.data[0]);
                    const toAccount = accountAddresses.get(data.data[1]);

                    if (fromAccount) {
                        MapUtils.update(publicBalancesNeedingUpdate, fromAccount, token)
                    }

                    if (toAccount) {
                        MapUtils.update(publicBalancesNeedingUpdate, toAccount, token)
                    }

                    triggerUpdate();
                })
            });

            Array.from(privateTokenSubscriptions.entries()).forEach(([address, subscription]) => {
                subscription.on((data) => {
                    const token = tokens.find((t) => t.tongoAddress === address);
                    if (!token) {
                        return;
                    }

                    const accountsToUpdate: AccountAddress[] = [];

                    if (data.keys[0] === privateFundEventKey) {
                        LOG.info("Fund event received for token", address);
                        const toTokenAddress = new PrivateTokenAddress(pubKeyFromData(data.keys[1], data.keys[2]));
                        const toAccountAddress = privateBalanceRepository.accountFromUnlockedTokenAddress(toTokenAddress);
                        if (toAccountAddress) {
                            accountsToUpdate.push(toAccountAddress);
                        }
                    } else if (data.keys[0] === privateTransferEventKey) {
                        LOG.info("Transfer event received for token", address);
                        const toTokenAddress = new PrivateTokenAddress(pubKeyFromData(data.keys[1], data.keys[2]));
                        const fromTokenAddress = new PrivateTokenAddress(pubKeyFromData(data.keys[3], data.keys[4]));

                        const toAccountAddress = privateBalanceRepository.accountFromUnlockedTokenAddress(toTokenAddress);
                        if (toAccountAddress) {
                            accountsToUpdate.push(toAccountAddress);
                        }

                        const fromAccountAddress = privateBalanceRepository.accountFromUnlockedTokenAddress(fromTokenAddress);
                        if (fromAccountAddress) {
                            accountsToUpdate.push(fromAccountAddress);
                        }
                    } else if (data.keys[0] === privateWithdrawEventKey) {
                        LOG.info("Withdraw event received for token", address);
                        const fromTokenAddress = new PrivateTokenAddress(pubKeyFromData(data.keys[1], data.keys[2]));
                        const fromAccountAddress = privateBalanceRepository.accountFromUnlockedTokenAddress(fromTokenAddress);
                        if (fromAccountAddress) {
                            accountsToUpdate.push(fromAccountAddress);
                        }
                    }

                    accountsToUpdate.forEach((accountAddress) => {
                        const account = accountAddresses.get(accountAddress);
                        if (account) {
                            MapUtils.update(privateBalancesNeedingUpdate, account, token);
                        }
                    });

                    triggerUpdate();
                })
            });
        },

        unsubscribeFromBalanceUpdates: async () => {
            LOG.info("Unsubscribing from balance updates");
            const { wsChannel } = useRpcStore.getState();
            accountsSubscribedToBalanceUpdates.clear();

            await Promise.all(Array.from(publicTokenSubscriptions.values()).map(s => s.unsubscribe()));
            await Promise.all(Array.from(privateTokenSubscriptions.values()).map(s => s.unsubscribe()));
            publicTokenSubscriptions.clear();
            privateTokenSubscriptions.clear();

            wsChannel.disconnect();
        },
    }
});
