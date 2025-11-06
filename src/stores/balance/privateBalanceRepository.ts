import Account, { AccountAddress } from "@/profile/account";
import HDKeyInstance from "@/profile/keyInstance";
import { KeySourceId } from "@/profile/keys/keySource";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { Account as TongoToken } from "@fatsolutions/tongo-sdk";
import { deriveStarknetKeyPairs, joinMnemonicWords, pathHash } from "@starkms/key-management";
import { RequestAccessFn } from "../accessVaultStore";
import BalanceRepository from "./balanceRepository";
import Token from "@/types/token";
import { PrivateTokenBalance } from "@/types/tokenBalance";

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
        const accountTokens = new Map<Account, Token[]>();
        for (const account of forAccounts) {
            for (const token of forTokens) {
                accountTokens.set(account, [...(accountTokens.get(account) ?? []), token]);
            }
        }

        const result = await requestAccess({ requestFor: "privateKeys", signing: [], tokens: accountTokens });

        for (const [account, tokenKeyPairs] of result.tokens.entries()) {
            const tongoToken = new TongoToken(tokenKeyPairs.keyPairs.spendingKeyPair.privateSpendingKey, tokenKeyPairs.token.tongoAddress, this.provider);
            this.tongoCache.set(this.cacheKey(account, tokenKeyPairs.token), tongoToken);
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