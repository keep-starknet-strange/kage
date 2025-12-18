import { AccountAddress } from "@/profile/account";
import i18n from "@/utils/i18n";
import { SwapAmount, SwapToken } from "@/utils/swap";
import { GetExecutionStatusResponse, SubmitDepositTxResponse } from "@defuse-protocol/one-click-sdk-typescript";

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

    export function from(status: SubmitDepositTxResponse.status | GetExecutionStatusResponse.status): SwapStatus {
        switch (status) {
            case SubmitDepositTxResponse.status.FAILED:
            case GetExecutionStatusResponse.status.FAILED:
                return SwapStatus.FAILED;
            case SubmitDepositTxResponse.status.REFUNDED:
            case GetExecutionStatusResponse.status.REFUNDED:
                return SwapStatus.REFUNDED;
            case SubmitDepositTxResponse.status.SUCCESS:
            case GetExecutionStatusResponse.status.SUCCESS:
                return SwapStatus.SUCCESS;
            case SubmitDepositTxResponse.status.PENDING_DEPOSIT:
            case SubmitDepositTxResponse.status.INCOMPLETE_DEPOSIT:
            case SubmitDepositTxResponse.status.PROCESSING:
            case SubmitDepositTxResponse.status.KNOWN_DEPOSIT_TX:
            case GetExecutionStatusResponse.status.PENDING_DEPOSIT:
            case GetExecutionStatusResponse.status.INCOMPLETE_DEPOSIT:
            case GetExecutionStatusResponse.status.PROCESSING:
            case GetExecutionStatusResponse.status.KNOWN_DEPOSIT_TX:
            default:
                return SwapStatus.PENDING;
        }
    }
}