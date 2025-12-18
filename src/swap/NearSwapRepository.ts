import { AppError } from "@/types/appError";
import { Quote, QuoteRequest, SwapStatus } from "@/types/swap";
import Token from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { SwapToken } from "@/utils/swap";
import { QuoteRequest as NearQuoteRequest, OneClickService, OpenAPI, TokenResponse } from '@defuse-protocol/one-click-sdk-typescript';
import nearTokens from "res/config/near.json";
import { SwapRepository } from "./SwapRepository";

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.EXPO_PUBLIC_NEAR_INTENTS_JWT;
const SELL_ON_BLOCKCHAIN = TokenResponse.blockchain.STARKNET;

const DRY_DEADLINE_MS = 5 * 60 * 1000; // 5 minutes
const DEADLINE_MS = 60 * 60 * 1000; // 1 hour

export class NearSwapRepository implements SwapRepository {

    private nearTokenIcons = new Map<string, string>();

    constructor(
        private readonly nearTokensCache: NearTokensCache = new NearTokensCache(),
    ) {
        for (const nearTokenConfig of nearTokens.tokens) {
            if (nearTokenConfig.defuseAssetId && nearTokenConfig.icon) {
                this.nearTokenIcons.set(nearTokenConfig.defuseAssetId, nearTokenConfig.icon);
            }

            const groupedTokens = nearTokenConfig.groupedTokens;
            if (groupedTokens) {
                for (const groupedToken of groupedTokens) {
                    this.nearTokenIcons.set(groupedToken.defuseAssetId, groupedToken.icon);
                }
            }
        }
    }

    async getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]> {
        const tokens = await this.getTokensForType(request.type).then((tokens) => tokens.map(token => {
            let modifiedAddress: string | undefined;

            if (token.contractAddress && token.blockchain === TokenResponse.blockchain.STARKNET) {
                modifiedAddress = TokenAddress.createOrNull(token.contractAddress)?.toString();
            } else {
                modifiedAddress = token.contractAddress;
            }

            return {
                ...token,
                contractAddress: modifiedAddress,
            }
        }));

        if (request.type === "buy") {
            return tokens.map(token => {
                return SwapToken.fromTokenResponse(token, this.nearTokenIcons.get(token.assetId))
            }).filter(token => token !== null) as SwapToken[];
        } else if (request.type === "sell") {
            return tokens
                .filter(token => token.blockchain === SELL_ON_BLOCKCHAIN)
                .map(nearToken => {
                    const nearTokenAddress = nearToken.contractAddress ? TokenAddress.createOrNull(nearToken.contractAddress) : null;
                    if (!nearTokenAddress) {
                        return null;
                    }

                    const availableToken = request.availableTokens.find(available => {
                        return available.contractAddress === nearTokenAddress
                    });

                    if (!availableToken) {
                        return null;
                    }

                    return SwapToken.fromTokenResponse(nearToken, availableToken.logo?.toString(), availableToken.name ?? undefined);
                })
                .filter(token => token !== null) as SwapToken[];
        } else {
            throw new AppError("Invalid request type", request);
        }
    }

    async requestQuote(request: QuoteRequest): Promise<Quote> {
        let swapType: NearQuoteRequest.swapType;
        const originAsset = request.amount.token.assetId;
        const destinationAsset = request.destinationToken.assetId;
        const swapAmount = request.amount.amount.toString();
        if (request.action === "sell") {
            swapType = NearQuoteRequest.swapType.EXACT_INPUT;
        } else {
            swapType = NearQuoteRequest.swapType.EXACT_OUTPUT;
        }

        const response = await OneClickService.getQuote({
            dry: request.dry,
            depositMode: NearQuoteRequest.depositMode.SIMPLE,
            swapType: swapType,
            slippageTolerance: request.slippage,
            originAsset: originAsset,
            depositType: NearQuoteRequest.depositType.ORIGIN_CHAIN,
            destinationAsset: destinationAsset,
            amount: swapAmount,
            refundTo: request.starknetAddress,
            refundType: NearQuoteRequest.refundType.ORIGIN_CHAIN,
            recipient: request.recipientAddress,
            recipientType: NearQuoteRequest.recipientType.DESTINATION_CHAIN,
            deadline: new Date(Date.now() + (request.dry ? DRY_DEADLINE_MS : DEADLINE_MS)).toISOString(),
            quoteWaitingTimeMs: 0,
        });

        return {
            id: response.correlationId,
            amountIn: response.quote.amountIn,
            amountInFormatted: response.quote.amountInFormatted,
            amountInUsd: response.quote.amountInUsd,
            minAmountIn: response.quote.minAmountIn,
            amountOut: response.quote.amountOut,
            amountOutFormatted: response.quote.amountOutFormatted,
            amountOutUsd: response.quote.amountOutUsd,
            minAmountOut: response.quote.minAmountOut,
            timeEstimate: response.quote.timeEstimate,
            depositAddress: response.quote.depositAddress,
        }
    }

    async depositSubmit(txHash: string, depositAddress: string): Promise<SwapStatus> {
        const response = await OneClickService.submitDepositTx({
            txHash: txHash,
            depositAddress: depositAddress,
        });

        return SwapStatus.from(response.status);
    }

    async checkSwapStatus(depositAddress: string): Promise<SwapStatus> {
        while (true) {
            const response = await OneClickService.getExecutionStatus(depositAddress);
            const status = SwapStatus.from(response.status);

            return status;
        }
    }

    protected getTokensForType(type: "buy" | "sell"): Promise<TokenResponse[]> {
        return this.nearTokensCache.getTokens(type)
    }
}

class NearTokensCache {
    private static CACHE_VALIDITY_MS = 5 * 60_000; // 5 minutes

    private tokens: TokenResponse[] = [];
    private lastUpdated: Date = new Date();

    public async getTokens(type: "buy" | "sell"): Promise<TokenResponse[]> {
        if (this.tokens.length > 0 && Date.now() - this.lastUpdated.getTime() > NearTokensCache.CACHE_VALIDITY_MS) {
            return this.tokens;
        }

        this.tokens = await OneClickService.getTokens();
        this.lastUpdated = new Date();

        return this.tokens;
    }

    private async mockResponse(): Promise<TokenResponse[]> {
        return [
            {
                assetId: "nep141:starknet.omft.near",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                symbol: "STRK",
                price: 0.106522,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "nep142:starknet.omft.near",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                symbol: "ETH",
                price: 3144.04,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "nep143:starknet.omft.near",
                decimals: 6,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                symbol: "USDC",
                price: 0.999951,
                priceUpdatedAt: new Date().toISOString()
            }
        ];
    }
}