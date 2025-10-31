import Account from "@/profile/account";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { Call, RpcProvider, uint256 } from "starknet";
import BalanceRepository from "./BalanceRepository";
import { PublicTokenBalance } from "./tokenBalance";

export class PublicBalanceRepository extends BalanceRepository {

    private provider: RpcProvider;
    
    constructor() {
        super();

        this.provider = new RpcProvider({ nodeUrl: NetworkDerfinition.mainnet().rpcUrl.toString(), batch: 0 });
    }

    setNetwork(network: NetworkDerfinition) {
        super.setNetwork(network);
        this.provider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 });
    }

    async getBalances(accounts: readonly Account[]): Promise<Map<string, PublicTokenBalance[]>> {
        const promises = accounts.map((account) => {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            return Array.from(this.tokenDefinitionsOnCurrentNetwork.keys()).map((token) => {
                return {
                    account: account.address,
                    token: token,
                    balancePromise: this.balanceOf(account.address, token)
                };
            });
        }).flat();

        const allBalances = await Promise.all(promises.map((promise) => promise.balancePromise));

        const results = new Map<string, PublicTokenBalance[]>();

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

    private async balanceOf(accountAddress: string, tokenAddress: string): Promise<bigint> {
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