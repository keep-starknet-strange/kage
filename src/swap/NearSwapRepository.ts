import { AppError } from "@/types/appError";
import Token from "@/types/token";
import { SwapToken } from "@/utils/swap";
import { OneClickService, OpenAPI, TokenResponse } from '@defuse-protocol/one-click-sdk-typescript';
import nearTokens from "res/config/near.json";
import { SwapRepository } from "./SwapRepository";

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.EXPO_PUBLIC_NEAR_INTENTS_JWT;
const SELL_ON_BLOCKCHAIN = 'eth';

export class NearSwapRepository implements SwapRepository {

    private nearTokenIcons = new Map<string, string>();

    constructor(
        private readonly nearTokensCache: NearTokensCache = new NearTokensCache(),
    ) {
        for (const nearTokenConfig of nearTokens.tokens) {
            const groupedTokens = nearTokenConfig.groupedTokens ?? [];
            for (const groupedToken of groupedTokens) {
                this.nearTokenIcons.set(groupedToken.defuseAssetId, groupedToken.icon);
            }
        }
    }

    async getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]> {
        const tokens = await this.nearTokensCache.getTokens();

        if (request.type === "buy") {
           return tokens.map(token => SwapToken.fromTokenResponse(token, this.nearTokenIcons.get(token.assetId) ?? null));   
        } else if (request.type === "sell") {
            return tokens
                .filter(token => token.blockchain === SELL_ON_BLOCKCHAIN)
                .filter(token => request.availableTokens.some(available => available.contractAddress === token.contractAddress))
                .map(token => SwapToken.fromTokenResponse(token, this.nearTokenIcons.get(token.assetId) ?? null)); 
        } else {
            throw new AppError("Invalid request type", request);
        }
    }
}

class NearTokensCache {
    private static CACHE_VALIDITY_MS = 5 * 60_000; // 5 minutes

    private tokens: TokenResponse[] = [];
    private lastUpdated: Date = new Date();

    public async getTokens(): Promise<TokenResponse[]> {
        if (this.tokens.length > 0 && Date.now() - this.lastUpdated.getTime() > NearTokensCache.CACHE_VALIDITY_MS) {
            return this.tokens;
        }

        const tokens = await OneClickService.getTokens();
        this.tokens = tokens;
        this.lastUpdated = new Date();

        return tokens;
    }
}