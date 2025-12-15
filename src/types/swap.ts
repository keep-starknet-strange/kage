import { AccountAddress } from "@/profile/account";
import { SwapAmount, SwapToken } from "@/utils/swap";

export type QuoteRequest = {
    dry: boolean;
    starknetAddress: AccountAddress;
    recipientAddress: string;
    action: "sell" | "buy";
    amount: SwapAmount;
    destinationToken: SwapToken;
    slippage: number;
}

export type Quote = {
    id: string;
    amountIn: string,
    amountInFormatted: string,
    amountInUsd: string,
    minAmountIn: string,
    amountOut: string,
    amountOutFormatted: string,
    amountOutUsd: string,
    minAmountOut: string,
    timeEstimate: number
}