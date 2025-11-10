import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import { PrivateTokenAddress } from "@/types/privateRecipient";
import Token from "@/types/token";
import { PrivateTokenBalance } from "@/types/tokenBalance";
import { Account as TongoToken } from "@fatsolutions/tongo-sdk";
import { RpcProvider } from "starknet";
import { RequestAccessFn } from "../accessVaultStore";
import BalanceRepository from "./balanceRepository";

export default class PrivateBalanceRepository extends BalanceRepository {

    // Keeps tongo accounts in memory. Current solution until we figure out how to avoid
    // keeping private keys in memory when using tongo sdk.
    private tongoCache: Map<string, TongoToken> = new Map();

    setNetwork(networkId: NetworkId, rpcProvider: RpcProvider) {
        super.setNetwork(networkId, rpcProvider);
        this.tongoCache.clear();
    }

    async getBalances(accounts: Map<Account, Token[]>): Promise<Map<AccountAddress, PrivateTokenBalance[]>> {
        this.logUpdates(accounts, true);

        const promisesTuples = Array.from(accounts.entries()).map(([account, tokens]) => {
            return tokens.map((token) => {
                const tongoToken = this.tongoCache.get(this.cacheKey(account, token));

                const promise = tongoToken ? Promise.all(
                    [tongoToken.state(), tongoToken.rate(), Promise.resolve(tongoToken.tongoAddress())]
                ).then(([balance, rate, address]) => {
                    const privateTokenAddress = PrivateTokenAddress.fromHex(address);
                    return PrivateTokenBalance.unlocked(token, rate, balance, privateTokenAddress);
                }) : Promise.resolve(PrivateTokenBalance.locked(token));

                return {
                    account: account.address,
                    token: token.contractAddress,
                    balancePromise: promise
                };
            });
        }).flat();

        const allBalances = await Promise.all(promisesTuples.map((tuple) => tuple.balancePromise));

        const results = new Map<string, PrivateTokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promisesTuples[index].account;

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
            // @ts-ignore
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