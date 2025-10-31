import { NetworkId } from "@/profile/misc";
import Token from "./token";
import tokensConfig from "res/config/tokens.json";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import Account from "@/profile/account";
import { PublicTokenBalance } from "./tokenBalance";

abstract class BalanceRepository {
    private config: Map<NetworkId, Token[]> = new Map();
    protected currentNetwork: NetworkId = "SN_MAIN";
    protected tokenDefinitionsOnCurrentNetwork: Map<string, Token> = new Map();

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
    }

    public async registerToken(token: Token, inNetwork: NetworkId) {
        const tokens = this.config.get(inNetwork) ?? [];
        tokens.push(token);
        this.config.set(inNetwork, tokens);

        if (this.currentNetwork === inNetwork) {
            this.updateTokensOnCurrentNetwork();
        }
    }

    public setNetwork(network: NetworkDerfinition) {
        this.currentNetwork = network.chainId;
        this.updateTokensOnCurrentNetwork();
    }

    private updateTokensOnCurrentNetwork() {
        this.tokenDefinitionsOnCurrentNetwork = new Map(
            this.config.get(this.currentNetwork)?.map((token) => {
                return [token.contractAddress, token];
            }) ?? []
        );
    }

    abstract getBalances(accounts: readonly Account[]): Promise<Map<string, PublicTokenBalance[]>>;
}

export default BalanceRepository;