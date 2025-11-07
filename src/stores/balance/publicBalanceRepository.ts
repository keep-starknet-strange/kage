import Account, { AccountAddress } from "@/profile/account";
import { Call, uint256 } from "starknet";
import BalanceRepository from "./balanceRepository";
import Token from "@/types/token";
import { PublicTokenBalance } from "@/types/tokenBalance";

export class PublicBalanceRepository extends BalanceRepository {

    async getBalances(accounts: Map<Account, Token[]>): Promise<Map<AccountAddress, PublicTokenBalance[]>> {
        const allRequestedTokens = new Map(Array.from(accounts.values())
            .flat()
            .map((token) => [token.contractAddress, token]));

        const promisesTuples = Array.from(accounts.entries()).map(([account, tokens]) => {
            const tokenAddresses = tokens.map((token) => token.contractAddress);
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            return tokenAddresses.map((tokenAddress) => {
                return {
                    account: account.address,
                    token: tokenAddress,
                    balancePromise: this.balanceOf(account.address, tokenAddress)
                };
            });
        }).flat();

        const allBalances = await Promise.all(promisesTuples.map((tuple) => tuple.balancePromise));
        const results = new Map<AccountAddress, PublicTokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promisesTuples[index].account;
            const tokenAddress = promisesTuples[index].token;
            const token = allRequestedTokens.get(tokenAddress);
            if (!token) {
                throw new Error(`Token ${tokenAddress} not found on current network ${this.currentNetwork}`);
            }

            const tokenBalancesForAccount = results.get(accountAddress) ?? [];
            tokenBalancesForAccount.push(new PublicTokenBalance(token, balance));
            results.set(accountAddress, tokenBalancesForAccount);
        });

        return results;
    }

    private async balanceOf(accountAddress: AccountAddress, tokenAddress: string): Promise<bigint> {
        const call: Call = {
            contractAddress: tokenAddress,
            entrypoint: "balance_of",
            calldata: [accountAddress]
        };
        const response = await this.provider.callContract(call);

        if (response && response.length >= 2) {
            // ERC-20 returns u256, which is 2 felts (low and high)
            return uint256.uint256ToBN({ low: response[0], high: response[1] });
        } else {
            throw new Error(`Error fetching balance of ${tokenAddress} for account ${accountAddress}. RAW RESPONSE: ${response}`);
        }
    }

}