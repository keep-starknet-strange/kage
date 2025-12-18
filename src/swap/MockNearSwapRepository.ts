import { Quote, QuoteRequest, SwapStatus } from "@/types/swap";
import { GetExecutionStatusResponse, OneClickService, SubmitDepositTxResponse, TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { NearSwapRepository } from "./NearSwapRepository";

export class MockNearSwapRepository extends NearSwapRepository {
    
    async requestQuote(request: QuoteRequest): Promise<Quote> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.mockQuoteResponse(request);
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
            depositAddress: request.dry ? undefined : `0x${id.replace(/-/g, '')}`,
        };
    }

    async depositSubmit(txHash: string, depositAddress: string): Promise<SwapStatus> {
        const response = await this.mockSubmitDepositTx(txHash, depositAddress);
        
        return SwapStatus.from(response.status);
    }

    // Track poll count per deposit address for mock simulation
    private pollCounts = new Map<string, number>();

    private async mockSubmitDepositTx(_txHash: string, depositAddress: string): Promise<{ status: SubmitDepositTxResponse.status }> {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        // Reset poll count for this deposit address
        this.pollCounts.set(depositAddress, 0);

        // Always return PENDING initially to trigger polling
        return {
            status: SubmitDepositTxResponse.status.KNOWN_DEPOSIT_TX,
        };
    }

    async checkSwapStatus(depositAddress: string): Promise<SwapStatus> {
        while (true) {
            const response = await this.mockGetExecutionStatus(depositAddress);
            const status = SwapStatus.from(response.status);

            return status;
        }
    }

    private async mockGetExecutionStatus(depositAddress: string): Promise<{ status: GetExecutionStatusResponse.status }> {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

        const currentCount = this.pollCounts.get(depositAddress) ?? 0;
        this.pollCounts.set(depositAddress, currentCount + 1);

        // Simulate processing: return PENDING for first 3 polls, then SUCCESS
        if (currentCount < 3) {
            const pendingStatuses = [
                GetExecutionStatusResponse.status.KNOWN_DEPOSIT_TX,
                GetExecutionStatusResponse.status.PENDING_DEPOSIT,
                GetExecutionStatusResponse.status.PROCESSING,
            ];
            return {
                status: pendingStatuses[currentCount],
            };
        }

        // After 3 polls, return SUCCESS
        return {
            status: GetExecutionStatusResponse.status.SUCCESS,
        };
    }
    
    getTokensForType(type: "buy" | "sell"): Promise<TokenResponse[]> {
        if (type === "sell") {
            return this.mockSellResponse();
        } else {
            return OneClickService.getTokens();
        }
    }

    private async mockSellResponse(): Promise<TokenResponse[]> {
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