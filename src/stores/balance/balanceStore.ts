import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import { AppError } from "@/types/appError";
import { PrivateTokenAddress } from "@/types/privateRecipient";
import Token from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { pubKeyFromData } from "@/utils/fatSolutions";
import { LOG } from "@/utils/logs";
import { MapUtils } from "@/utils/map";
import tokensConfig from "res/config/tokens.json";
import { hash, num, RpcProvider, SubscriptionStarknetEventsEvent } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "../accessVaultStore";
import { useAppDependenciesStore } from "../appDependenciesStore";
import { useRpcStore } from "../useRpcStore";
import PrivateBalanceRepository from "./privateBalanceRepository";
import { PublicBalanceRepository } from "./publicBalanceRepository";

type PresetNetworkId = keyof typeof tokensConfig;

const PRICE_REFRESH_INTERVAL_MS = 60000;

export interface BalanceState {
    networkId: NetworkId | null;
    unlockedPrivateBalances: Set<AccountAddress>;

    publicBalances: ReadonlyMap<AccountAddress, PublicTokenBalance[]>,
    privateBalances: ReadonlyMap<AccountAddress, PrivateTokenBalance[]>,

    setNetwork: (networkId: NetworkId, rpcProvider: RpcProvider) => Promise<void>,
    requestRefresh: (publicBalancesFor: Account[], privateBalancesFor: Account[]) => Promise<void>,
    unlockPrivateBalances: (accounts: Account[]) => Promise<void>,
    lockPrivateBalances: (accounts: Account[]) => Promise<void>,

    subscribeToBalanceUpdates: (accounts: Account[]) => Promise<void>,
    unsubscribeFromBalanceUpdates: () => Promise<void>,

    startPriceRefresh: () => Promise<void>,
    stopPriceRefresh: () => void,

    reset: () => Promise<void>,
}

export const useBalanceStore = create<BalanceState>((set, get) => {

    const privateBalanceRepository = new PrivateBalanceRepository();
    const publicBalanceRepository = new PublicBalanceRepository();
    let networkTokens = new Map<TokenAddress, Token>();

    const publicTokenSubscriptions = new Map<string, SubscriptionStarknetEventsEvent>();
    const privateTokenSubscriptions = new Map<string, SubscriptionStarknetEventsEvent>();

    let intervalId: NodeJS.Timeout | null = null;

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
        networkId: null,
        unlockedPrivateBalances: new Set(),
        publicBalances: new Map(),
        privateBalances: new Map(),

        setNetwork: async (networkId: NetworkId, rpcProvider: RpcProvider) => {
            const { networkId: currentNetworkId } = get();
            if (currentNetworkId === networkId) {
                return;
            }
            const { marketRepository } = useAppDependenciesStore.getState();

            LOG.info("Balance network to", networkId);

            privateBalanceRepository.setNetwork(networkId, rpcProvider);
            publicBalanceRepository.setNetwork(networkId, rpcProvider);

            const presetExists = Object.prototype.hasOwnProperty.call(tokensConfig, networkId);
            let tokens: Map<TokenAddress, Token>;
            if (presetExists) {
                const preset = tokensConfig[networkId as PresetNetworkId];
                tokens = new Map(preset.tokens.map((token) => {
                    const address = TokenAddress.create(token.erc20);
                    return [address, new Token(address, token.tongo, token.symbol, token.decimals)]
                }));
                const feeTokenAddress = TokenAddress.create(preset.feeTokenAddress);
                if (!tokens.has(feeTokenAddress)) {
                    throw new AppError("Fee token not found for network " + networkId + ". Make sure tokens.json is configured properly.");
                }
            } else {
                throw new AppError("Network " + networkId + " is not configured in tokens.json. Dynamic presets not supported yet.");
            }

            const tokenMetadata = await marketRepository.getTokenMetadata(Array.from(tokens.values()).map(token => token.contractAddress), networkId);
            networkTokens = new Map(Array.from(tokens.entries()).map(([address, token]) => {
                const metadata = tokenMetadata.get(address);
                return [address, metadata ? token.withMetadata(metadata) : token];
            }));

            set({
                networkId: networkId,
                unlockedPrivateBalances: new Set(),
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
            const { unlockedPrivateBalances, requestRefresh } = get()

            const allTokens = Array.from(networkTokens.values());

            await privateBalanceRepository.unlock(accounts, allTokens, requestAccess);
            const newUnlockedPrivateBalances = new Set([...unlockedPrivateBalances, ...accounts.map((account) => account.address)]);
            set({ unlockedPrivateBalances: newUnlockedPrivateBalances });
            await requestRefresh([], accounts);
        },
        lockPrivateBalances: async (accounts: Account[]) => {
            const { unlockedPrivateBalances, requestRefresh } = get();
            await privateBalanceRepository.lock(accounts, Array.from(networkTokens.values()));
            const newUnlockedPrivateBalances = new Set([...unlockedPrivateBalances].filter((address) => !accounts.some((account) => account.address === address)));
            set({ unlockedPrivateBalances: newUnlockedPrivateBalances });
            await requestRefresh([], accounts);
        },

        subscribeToBalanceUpdates: async (accounts: Account[]) => {
            await Promise.all(Array.from(publicTokenSubscriptions.values()).map(s => s.unsubscribe()));
            await Promise.all(Array.from(privateTokenSubscriptions.values()).map(s => s.unsubscribe()));
            publicTokenSubscriptions.clear();
            privateTokenSubscriptions.clear();

            const tokens = Array.from(networkTokens.values());
            const { subscribeToWS } = useRpcStore.getState();

            const wsChannel = await subscribeToWS();

            LOG.info(`Listening for: [${accounts.map((account) => account.name).join(", ")}]`);
            const accountAddresses = new Map(accounts.map((account) => [account.address, account]));

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
                    LOG.error('Error in processUpdate:', error);
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

                    const fromAccount = accountAddresses.get(AccountAddress.fromHex(data.data[0]));
                    const toAccount = accountAddresses.get(AccountAddress.fromHex(data.data[1]));

                    if (fromAccount) {
                        LOG.info("Public transfer event received for token", address, "from", fromAccount.name);
                        MapUtils.update(publicBalancesNeedingUpdate, fromAccount, token)
                    }

                    if (toAccount) {
                        LOG.info("Public transfer event received for token", address, "to", toAccount.name);
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

            get().startPriceRefresh();
        },

        unsubscribeFromBalanceUpdates: async () => {
            const { unsubscribeFromWS } = useRpcStore.getState();

            if (publicTokenSubscriptions.size > 0) {
                LOG.info("Unsubscribing from public balance updates");
                await Promise.all(Array.from(publicTokenSubscriptions.values()).map(s => s.unsubscribe()));
            }

            if (privateTokenSubscriptions.size > 0) {
                LOG.info("Unsubscribing from private balance updates");
                await Promise.all(Array.from(privateTokenSubscriptions.values()).map(s => s.unsubscribe()));
            }

            publicTokenSubscriptions.clear();
            privateTokenSubscriptions.clear();
            await unsubscribeFromWS();
            get().stopPriceRefresh();
        },

        startPriceRefresh: async () => {
            const { networkId, stopPriceRefresh } = get();
            if (networkId === null) {
                LOG.warn("No network set, skipping price refresh");
                return;
            }
            const { marketRepository } = useAppDependenciesStore.getState();

            stopPriceRefresh();
            LOG.info("Starting price refresh");
            intervalId = setInterval(async () => {
                const tokenAddresses = Array.from(networkTokens.keys());
                try {
                    const prices = await marketRepository.getTokenPrices(tokenAddresses, networkId);
                    const updatedTokens = new Map<TokenAddress, Token>();
                    for (const [address, token] of networkTokens.entries()) {
                        const price = prices.get(address);
                        if (price) {
                            updatedTokens.set(address, token.withUpdatedPrice(price));
                        } else {
                            updatedTokens.set(address, token);
                        }
                    }

                    networkTokens = updatedTokens;
                    const { publicBalances, privateBalances } = get();
                    const newPublicBalances = new Map(Array.from(publicBalances.entries()).map(([account, balances]) => {
                        return [account, balances.map((balance) => {
                            const token = networkTokens.get(balance.token.contractAddress) ?? balance.token;
                            return balance.withUpdatedToken(token);
                        })];
                    }));
                    const newPrivateBalances = new Map(Array.from(privateBalances.entries()).map(([account, balances]) => {
                        return [account, balances.map((balance) => {
                            const token = networkTokens.get(balance.token.contractAddress) ?? balance.token;
                            return balance.withUpdatedToken(token);
                        })];
                    }));

                    set({
                        publicBalances: newPublicBalances,
                        privateBalances: newPrivateBalances
                    });
                } catch (error) {
                    LOG.error("Error refreshing token prices:", error);
                }
            }, PRICE_REFRESH_INTERVAL_MS);
        },

        stopPriceRefresh: () => {
            if (intervalId) {
                LOG.info("Stopping price refresh");
                clearInterval(intervalId);
                intervalId = null;
            }
        },

        reset: async () => {
            const { unsubscribeFromBalanceUpdates, stopPriceRefresh } = get();
            await unsubscribeFromBalanceUpdates();
            stopPriceRefresh();
            networkTokens = new Map<TokenAddress, Token>();

            set({
                networkId: null,
                unlockedPrivateBalances: new Set(),
            });
        }
    }
});
