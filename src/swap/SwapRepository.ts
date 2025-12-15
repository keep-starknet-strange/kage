import { AccountAddress } from "@/profile/account";
import { Quote, QuoteRequest } from "@/types/swap";
import Token from "@/types/token";
import { SwapAmount, SwapToken } from "@/utils/swap";

export interface SwapRepository {
    getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]>;

    requestQuote(request: QuoteRequest): Promise<Quote>;
}

