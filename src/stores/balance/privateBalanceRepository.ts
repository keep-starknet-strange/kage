import Account, { AccountAddress } from "@/profile/account";
import HDKeyInstance from "@/profile/keyInstance";
import { KeySourceId } from "@/profile/keys/keySource";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { Account as TongoToken } from "@fatsolutions/tongo-sdk";
import { deriveStarknetKeyPairs, joinMnemonicWords, pathHash } from "@starkms/key-management";
import { RequestAccessFn } from "../accessVaultStore";
import BalanceRepository from "./balanceRepository";
import Token from "./token";
import { PrivateTokenBalance } from "./tokenBalance";

export default class PrivateBalanceRepository extends BalanceRepository {

    // Keeps tongo accounts in memory. Current solution until we figure out how to avoid
    // keeping private keys in memory when using tongo sdk.
    private tongoCache: Map<string, TongoToken> = new Map();

    setNetwork(network: NetworkDerfinition) {
        super.setNetwork(network);
        this.tongoCache.clear();
    }

    async getBalances(accounts: Account[], forTokens: Token[]): Promise<Map<AccountAddress, PrivateTokenBalance[]>> {
        const promises = accounts.map((account) => {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            return accounts.map((account) => {
                return forTokens.map((token) => {
                    const tongoToken = this.tongoCache.get(this.cacheKey(account, token));

                    const promise = tongoToken ? Promise.all([tongoToken.state(), tongoToken.rate()])
                        .then(([balance, rate]) => PrivateTokenBalance.unlocked(token, rate, balance)) : Promise.resolve(PrivateTokenBalance.locked(token));

                    return {
                        account: account.address,
                        token: token.contractAddress,
                        balancePromise: promise
                    };
                });
            }).flat();
        }).flat();

        const allBalances = await Promise.all(promises.map((promise) => promise.balancePromise));

        const results = new Map<string, PrivateTokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promises[index].account;
            const tokenBalances = results.get(accountAddress) ?? [];
            tokenBalances.push(balance);
            
            results.set(accountAddress, tokenBalances);
        });

        return results;
    }

    async unlock(forAccounts: readonly Account[], forTokens: Token[], requestAccess: RequestAccessFn) {
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

                    for (const token of forTokens) {
                        const tongoIndex = pathHash(`${account.address}.${token.contractAddress}.${token.tongoAddress}`);
                        const tongoKeyPairs = deriveStarknetKeyPairs({
                            accountIndex: accountIndex,
                            addressIndex: tongoIndex,
                        }, mnemonicWords, true);                        

                        const tongoToken = new TongoToken(tongoKeyPairs.spendingKeyPair.privateSpendingKey, token.tongoAddress, this.provider);

                        this.tongoCache.set(this.cacheKey(account, token), tongoToken);
                    }
                }
            }
        }
    }


    async lock(forAccounts: readonly Account[], forTokens: Token[]) {
        for (const account of forAccounts) {
            for (const token of forTokens) {
                this.tongoCache.delete(this.cacheKey(account, token));
            }
        }
    }

    lockAll() {
        this.tongoCache.clear();
    }

    private cacheKey(account: Account, token: Token): string {
        return `${account.address}.${token.contractAddress}.${token.tongoAddress}`;
    }
}