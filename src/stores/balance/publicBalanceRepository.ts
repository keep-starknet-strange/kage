import Account, { AccountAddress } from "@/profile/account";
import { Call, uint256 } from "starknet";
import BalanceRepository from "./balanceRepository";
import Token from "./token";
import { PublicTokenBalance } from "./tokenBalance";

export class PublicBalanceRepository extends BalanceRepository {

    async getBalances(accounts: Account[], forTokens: Token[]): Promise<Map<AccountAddress, PublicTokenBalance[]>> {
        const tokensWithAddresses = new Map(forTokens.map((token) => [token.contractAddress, token]));
        const promises = accounts.map((account) => {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            return Array.from(tokensWithAddresses.keys()).map((token) => {
                return {
                    account: account.address,
                    token: token,
                    balancePromise: this.balanceOf(account.address, token)
                };
            });
        }).flat();

        const allBalances = await Promise.all(promises.map((promise) => promise.balancePromise));

        const results = new Map<AccountAddress, PublicTokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promises[index].account;
            const tokenAddress = promises[index].token;
            const tokenBalances = results.get(accountAddress) ?? [];
            const token = tokensWithAddresses.get(tokenAddress);

            if (!token) {
                throw new Error(`Token ${tokenAddress} not found on current network ${this.currentNetwork}`);
            }

            tokenBalances.push(new PublicTokenBalance(token, balance));
            results.set(accountAddress, tokenBalances);
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