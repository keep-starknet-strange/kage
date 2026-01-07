import { Quote, QuoteRequest, SwapStatus } from "@/types/swap";
import Token from "@/types/token";
import { SwapToken } from "@/utils/swap";

export interface SwapRepository {
    getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]>;

    requestQuote(request: QuoteRequest): Promise<Quote>;

    depositSubmit(
        txHash: string,
        depositAddress: string,
    ): Promise<SwapStatus>;

    checkSwapStatus(
        depositAddress: string,
    ): Promise<SwapStatus>;
}

