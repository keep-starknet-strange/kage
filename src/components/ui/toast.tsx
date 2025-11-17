import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import React from "react"
import Toast, { ToastConfig } from "react-native-toast-message";
import { ErrorToast } from "./error-toast";
import { TransactionToast } from "./transaction-toast";
import { AppError, CancellationError } from "@/types/appError";
import { RpcError, TimeoutError, WebSocketNotConnectedError } from "starknet";
import { Transaction } from "@/types/transaction";

export function showToastError(error: any) {
    if (error instanceof CancellationError) {
        return;
    }

    let message = "";
    let details: string | null = null;
    
    if (error instanceof AppError) {
        message = error.message;
        if (error.details) {
            details = JSON.stringify(error.details);
        }
    } else if (error instanceof WebSocketNotConnectedError) {
        message = "WebSocket not connected";
        details = error.message;
    } else if (error instanceof TimeoutError) {
        message = "Request timed out";
        details = error.message;
    } else if (error instanceof RpcError) {
        message = error.baseError.message;
        details = JSON.stringify(error.baseError);
    } else if (error instanceof Error) {
        if (error.message === "invalid tag") {
            message = "Wrong passphrase";
        } else {
            message = error.message;
        }
    }

    Toast.show({
        type: "customError",
        props: {
            title: "An error occurred",
            subtitle: message,
            details: details,
        },
    });
}

export function showToastTransaction(transaction: Transaction, pending: boolean = false) {
    Toast.show({
        type: "transaction",
        props: {
            transaction: Transaction.toSerializable(transaction),
            pending,
        },
        autoHide: !pending,
        visibilityTime: 5000,
    });
}

const toastConfig: ToastConfig = {
    customError: ({ props }) => (
        <ErrorToast
            title={props.title}
            subtitle={props.subtitle}
            details={props.details}
        />
    ),
    transaction: ({ props }) => (
        <TransactionToast
            transaction={props.transaction}
            pending={props.pending}
        />
    ),
};

export default function KageToast() {
    const { insets } = useDynamicSafeAreaInsets();

    return (
        <Toast
            position="top"
            topOffset={insets.top + 20}
            config={toastConfig}
        />
    );
}