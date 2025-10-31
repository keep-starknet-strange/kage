import { Account as TongoToken } from "@fatsolutions/tongo-sdk";
import BalanceRepository from "./BalanceRepository";
import Account from "@/profile/account";
import { PrivateTokenBalance } from "./tokenBalance";
import { KeySourceId } from "@/profile/keys/keySource";
import HDKeyInstance from "@/profile/keyInstance";
import { RequestAccessFn } from "../accessVaultStore";
import { deriveStarknetKeyPairs, joinMnemonicWords, pathHash } from "@starkms/key-management";
import { RpcProvider } from "starknet";
import NetworkDerfinition from "@/profile/settings/networkDefinition";

export default class PrivateBalanceRepository extends BalanceRepository {

    // Keeps tongo accounts in memory. Current solution until we figure out how to avoid
    // keeping private keys in memory when using tongo sdk.
    private tongoCache: Map<string, Map<string, TongoToken>> = new Map();
    private provider: RpcProvider;

    constructor() {
        super();

        this.provider = new RpcProvider({ nodeUrl: NetworkDerfinition.mainnet().rpcUrl.toString() });
    }

    setNetwork(network: NetworkDerfinition) {
        super.setNetwork(network);
        this.provider = new RpcProvider({ nodeUrl: network.rpcUrl.toString() });
    }

    async getBalances(accounts: readonly Account[]): Promise<Map<string, PrivateTokenBalance[]>> {
        for (const account of accounts) {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            const accountTokens = this.tongoCache.get(account.address);
            if (!accountTokens) {
                throw new Error(`Balances for account ${account.address} are not unlocked.`);
            }
            
        }

        const promises = accounts.map((account) => {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            const accountTokens = this.tongoCache.get(account.address);
            if (!accountTokens) {
                throw new Error(`Balances for account ${account.address} are not unlocked.`);
            }

            return Array.from(accountTokens.entries()).map(([tokenAddress, tongoToken]) => {
                const token = this.tokenDefinitionsOnCurrentNetwork.get(tokenAddress); 
                if (!token) {
                    throw new Error(`Token ${tokenAddress} not found on current network ${this.currentNetwork}`);
                }

                return {
                    account: account.address,
                    token: token,
                    balancePromise: tongoToken.state()
                };
            });
        }).flat();

        const allBalances = await Promise.all(promises.map((promise) => promise.balancePromise));

        const results = new Map<string, PrivateTokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promises[index].account;
            const tokenAddress = promises[index].token;
            const tokenBalances = results.get(accountAddress) ?? [];
            const token = this.tokenDefinitionsOnCurrentNetwork.get(tokenAddress);

            if (!token) {
                throw new Error(`Token ${tokenAddress} not found on current network ${this.currentNetwork}`);
            }

            tokenBalances.push(new PublicTokenBalance(token, balance));
            results.set(accountAddress, tokenBalances);
        });

        return results;
    }

    async unlock(forAccounts: readonly Account[], requestAccess: RequestAccessFn) {
        const keySourcesToUnlock = new Set<KeySourceId>();

        for (const account of forAccounts) {
            if (account.keyInstance instanceof HDKeyInstance) {
                keySourcesToUnlock.add(account.keyInstance.keySourceId);
            }
        }

        for (const keySourceId of keySourcesToUnlock) {
            const seedPhrase = await requestAccess({ requestFor: "seedphrase", keySourceId });
            const mnemonicWords = joinMnemonicWords(seedPhrase);

            for (const account of forAccounts) {
                if (account.keyInstance instanceof HDKeyInstance && account.keyInstance.keySourceId === keySourceId) {
                    const accountIndex = account.keyInstance.index;

                    for (const token of this.tokenDefinitionsOnCurrentNetwork.values()) {
                        const tongoIndex = pathHash(`${account.address}.${token.contractAddress}.${token.tongoAddress}`);
                        const tongoKeyPairs = deriveStarknetKeyPairs({
                            accountIndex: accountIndex,
                            addressIndex: tongoIndex,
                        }, mnemonicWords, true);                        

                        const tongoToken = new TongoToken(tongoKeyPairs.spendingKeyPair.privateSpendingKey, token.tongoAddress, this.provider);

                        const accountTokens = this.tongoCache.get(account.address) ?? new Map();
                        accountTokens.set(token.contractAddress, tongoToken);
                        this.tongoCache.set(account.address, accountTokens);
                    }
                }
            }
        }
    }

    lock(forAccounts: readonly Account[]) {
        for (const account of forAccounts) {
            this.tongoCache.delete(account.address);
        }
    }

    lockAll() {
        this.tongoCache.clear();
    }
}