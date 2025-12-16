import { AccountAddress } from "@/profile/account";
import i18n from "@/utils/i18n";
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
    timeEstimate: number,
    depositAddress?: string,
}

export enum SwapStatus {
    PENDING,
    SUCCESS,
    FAILED,
    REFUNDED,
}

export namespace SwapStatus {
    export function toString(status: SwapStatus): string {
        switch (status) {
            case SwapStatus.PENDING:
                return i18n.t('transactions.status.swapPending');
            case SwapStatus.SUCCESS:
                return i18n.t('transactions.status.swapSuccess');
            case SwapStatus.FAILED:
                return i18n.t('transactions.status.swapFailed');
            case SwapStatus.REFUNDED:
                return i18n.t('transactions.status.swapRefunded');
        }
    }
}