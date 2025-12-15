import { AppError } from "@/types/appError";
import Token from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { SwapToken } from "@/utils/swap";
import { QuoteRequest as NearQuoteRequest, OneClickService, OpenAPI, TokenResponse } from '@defuse-protocol/one-click-sdk-typescript';
import nearTokens from "res/config/near.json";
import { SwapRepository } from "./SwapRepository";
import { QuoteRequest, Quote } from "@/types/swap";

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
            const groupedTokens = nearTokenConfig.groupedTokens ?? [];
            for (const groupedToken of groupedTokens) {
                this.nearTokenIcons.set(groupedToken.defuseAssetId, groupedToken.icon);
            }
        }
    }

    async getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]> {
        const tokens = await this.nearTokensCache.getTokens(request.type);

        if (request.type === "buy") {
            return tokens.map(token => SwapToken.fromTokenResponse(
                token,
                this.nearTokenIcons.get(token.assetId) ?? null)
            ).filter(token => token !== null) as SwapToken[];
        } else if (request.type === "sell") {
            return tokens
                .filter(token => token.blockchain === SELL_ON_BLOCKCHAIN)
                .filter(token => {
                    return request.availableTokens.some(available => {
                        if (!token.contractAddress) {
                            return false;
                        }
                        const onStarknetAddress = TokenAddress.createOrNull(token.contractAddress);
                        return available.contractAddress.toString() === onStarknetAddress
                    });
                })
                .map(token => {
                    return SwapToken.fromTokenResponse(token, this.nearTokenIcons.get(token.assetId) ?? null)
                })
                .filter(token => token !== null) as SwapToken[];
        } else {
            throw new AppError("Invalid request type", request);
        }
    }

    async requestQuote(request: QuoteRequest): Promise<Quote> {
        // Use mock response for Starknet tokens until OneClick API supports them
        // if (request.amount.token.blockchain === "STARKNET") {
            return this.mockQuoteResponse(request);
        // }

        let swapType: NearQuoteRequest.swapType;
        const originAsset = request.amount.token.contractAddress;
        const destinationAsset = request.destinationToken.contractAddress;
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
        }
    }

    private mockQuoteResponse(request: QuoteRequest): Quote {
        const id = crypto.randomUUID();
        const originToken = request.amount.token;
        const destinationToken = request.destinationToken;
        const inputAmount = request.amount.amount;

        // Calculate USD value of input
        const inputDecimals = BigInt(10 ** originToken.decimals);
        const inputAmountFloat = Number(inputAmount) / Number(inputDecimals);
        const inputUsdValue = inputAmountFloat * originToken.price;

        // Calculate output amount based on destination token price
        const outputDecimals = BigInt(10 ** destinationToken.decimals);
        const outputAmountFloat = inputUsdValue / destinationToken.price;
        const outputAmount = BigInt(Math.floor(outputAmountFloat * Number(outputDecimals)));

        // Apply slippage for min amounts (slippage is in basis points, e.g., 50 = 0.5%)
        const slippageMultiplier = 1 - (request.slippage / 10000);
        const minOutputAmount = BigInt(Math.floor(Number(outputAmount) * slippageMultiplier));
        const maxInputAmount = BigInt(Math.ceil(Number(inputAmount) / slippageMultiplier));

        // Format amounts for display
        const formatAmount = (amount: bigint, decimals: number): string => {
            const divisor = BigInt(10 ** decimals);
            const whole = amount / divisor;
            const fraction = amount % divisor;
            const fractionStr = fraction.toString().padStart(decimals, '0');
            // Trim trailing zeros but keep at least 2 decimal places
            const trimmedFraction = fractionStr.replace(/0+$/, '').padEnd(2, '0');
            return `${whole}.${trimmedFraction}`;
        };

        const amountInFormatted = formatAmount(inputAmount, originToken.decimals);
        const amountOutFormatted = formatAmount(outputAmount, destinationToken.decimals);
        const outputUsdValue = outputAmountFloat * destinationToken.price;

        return {
            id: id,
            amountIn: inputAmount.toString(),
            amountInFormatted: amountInFormatted,
            amountInUsd: inputUsdValue.toFixed(2),
            minAmountIn: inputAmount.toString(), // For EXACT_INPUT, minAmountIn equals amountIn
            amountOut: outputAmount.toString(),
            amountOutFormatted: amountOutFormatted,
            amountOutUsd: outputUsdValue.toFixed(2),
            minAmountOut: minOutputAmount.toString(),
            timeEstimate: 30, // Mock: 30 seconds estimated swap time
        };
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

        let serviceTokens: TokenResponse[];
        if (type === "sell") {
            serviceTokens = await this.mockResponse();
        } else {
            serviceTokens = await OneClickService.getTokens();
        }

        // const tokens = await OneClickService.getTokens();
        const tokens = serviceTokens.map(token => {
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
        });
        this.tokens = tokens;
        this.lastUpdated = new Date();

        return tokens;
    }

    private async mockResponse(): Promise<TokenResponse[]> {
        return [
            {
                assetId: "starknet:strk",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                symbol: "STRK",
                price: 0.106522,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:eth",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                symbol: "ETH",
                price: 3144.04,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:usdc",
                decimals: 6,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                symbol: "USDC",
                price: 0.999951,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:usdt",
                decimals: 6,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
                symbol: "USDT",
                price: 1.0,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:dai",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3",
                symbol: "DAI",
                price: 0.999716,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:wbtc",
                decimals: 8,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
                symbol: "wBTC",
                price: 89835,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:wsteth",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x042b8f0484674ca266ac5d08e4ac6a3fe65bd3129795def2dca5c34ecc5f96d2",
                symbol: "wstETH",
                price: 3720.50,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:lords",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49",
                symbol: "LORDS",
                price: 0.0245,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:brother",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x03b405a98c9e795d427fe82cdeeeed803f221b52471e3a757574a2b4180793ee",
                symbol: "BROTHER",
                price: 0.00089,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:zend",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x00585c32b625999e6e5e78645ff8df7a9001cf5cf3eb6b80ccdd16cb64bd3a34",
                symbol: "ZEND",
                price: 0.0127,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:nstr",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x04619e9ce4109590219c5263787050726be63382148538f3f936c22aa87d2fc2",
                symbol: "NSTR",
                price: 0.0015,
                priceUpdatedAt: new Date().toISOString()
            },
            {
                assetId: "starknet:ekubo",
                decimals: 18,
                blockchain: TokenResponse.blockchain.STARKNET,
                contractAddress: "0x075afe6402ad5a5c20dd25e10ec3b3986acaa647b77e4ae24b0cbc9a54a27a87",
                symbol: "EKUBO",
                price: 0.45,
                priceUpdatedAt: new Date().toISOString()
            },
        ];
    }
}