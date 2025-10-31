import Account from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import tokensConfig from "res/config/tokens.json";
import { Call, RpcProvider, uint256 } from "starknet";
import Token from "./token";
import TokenBalance from "./tokenBalance";

export class BalanceRepository {

    private provider: RpcProvider;
    private config: Map<NetworkId, Token[]> = new Map();
    private currentNetwork: NetworkId = "SN_MAIN";
    private tokenDefinitionsOnCurrentNetwork: Map<string, Token> = new Map();

    constructor() {
        // First check if config is valid
        if (new Set(tokensConfig.SN_MAIN.map(token => token.erc20)).size !== tokensConfig.SN_MAIN.length) {
            throw new Error("tokens.json for SN_MAIN contains duplicate erc20 entries");
        }

        if (new Set(tokensConfig.SN_SEPOLIA.map(token => token.erc20)).size !== tokensConfig.SN_MAIN.length) {
            throw new Error("tokens.json for SN_SEPOLIA contains duplicate erc20 entries");
        }

        tokensConfig.SN_MAIN.forEach((token) => {
            const tokens = this.config.get('SN_MAIN') ?? [];
            tokens.push(new Token(token.erc20, token.tongo, token.symbol, token.decimals));
            this.config.set('SN_MAIN', tokens);
        });

        tokensConfig.SN_SEPOLIA.forEach((token) => {
            const tokens = this.config.get('SN_SEPOLIA') ?? [];
            tokens.push(new Token(token.erc20, token.tongo, token.symbol, token.decimals));
            this.config.set('SN_SEPOLIA', tokens);
        });

        this.provider = new RpcProvider({ nodeUrl: NetworkDerfinition.mainnet().rpcUrl.toString(), batch: 0 });
    }

    public setNetwork(network: NetworkDerfinition) {
        this.currentNetwork = network.chainId;
        this.provider = new RpcProvider({ nodeUrl: network.rpcUrl.toString(), batch: 0 });
        this.updateTokensOnCurrentNetwork();
    }

    public async registerToken(token: Token, inNetwork: NetworkId) {
        const tokens = this.config.get(inNetwork) ?? [];
        tokens.push(token);
        this.config.set(inNetwork, tokens);

        if (this.currentNetwork === inNetwork) {
            this.updateTokensOnCurrentNetwork();
        }
    }

    public async getBalances(accounts: readonly Account[]): Promise<Map<string, TokenBalance[]>> {
        const promises = accounts.map((account) => {
            if (account.networkId !== this.currentNetwork) {
                throw new Error(`Balance repository is set to ${this.currentNetwork} but account ${account.address} is on ${account.networkId}`);
            }

            const array = Array.from(this.tokenDefinitionsOnCurrentNetwork.keys());
            return Array.from(this.tokenDefinitionsOnCurrentNetwork.keys()).map((token) => {
                return {
                    account: account.address,
                    token: token,
                    balancePromise: this.balanceOf(account.address, token)
                };
            });
        }).flat();

        const allBalances = await Promise.all(promises.map((promise) => promise.balancePromise));

        const results = new Map<string, TokenBalance[]>();

        allBalances.forEach((balance, index) => {
            const accountAddress = promises[index].account;
            const tokenAddress = promises[index].token;
            const tokenBalances = results.get(accountAddress) ?? [];
            const token = this.tokenDefinitionsOnCurrentNetwork.get(tokenAddress);

            if (!token) {
                throw new Error(`Token ${tokenAddress} not found on current network ${this.currentNetwork}`);
            }

            tokenBalances.push(new TokenBalance(token, balance));
            results.set(accountAddress, tokenBalances);
        });

        return results;
    }

    private updateTokensOnCurrentNetwork() {
        this.tokenDefinitionsOnCurrentNetwork = new Map(
            this.config.get(this.currentNetwork)?.map((token) => {
                return [token.contractAddress, token];
            }) ?? []
        );
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