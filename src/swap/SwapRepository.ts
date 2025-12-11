import Token from "@/types/token";
import { SwapToken } from "@/utils/swap";

export interface SwapRepository {
    getAvailableTokens(request: { type: "buy" } | { type: "sell", availableTokens: Token[] }): Promise<SwapToken[]>;
}

