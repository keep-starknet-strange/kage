import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { AppError, CancellationError } from "@/types/appError";
import { Transaction } from "@/types/transaction";
import React from "react";
import Toast, { ToastConfig } from "react-native-toast-message";
import uuid from 'react-native-uuid';
import { RpcError, TimeoutError, WebSocketNotConnectedError } from "starknet";
import { ErrorToast } from "./error-toast";
import { NetworkChangeToast } from "./network-change-toast";
import { TransactionToast } from "./transaction-toast";
import i18n from "@/utils/i18n";

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
        message = i18n.t('errors.websocketNotConnected');
        details = error.message;
    } else if (error instanceof TimeoutError) {
        message = i18n.t('errors.requestTimedOut');
        details = error.message;
    } else if (error instanceof RpcError) {
        if (error.isType('VALIDATION_FAILURE') && error.baseError.data.includes("exceed balance")) {
            message = i18n.t('errors.insufficientBalance');
        } else {
            message = error.baseError.message;
        }
        details = JSON.stringify(error.baseError);
    } else if (error instanceof Error) {
        if (error.message === "invalid tag") {
            message = i18n.t('errors.wrongPassphrase');
        } else {
            message = error.message;
        }
    }

    Toast.show({
        type: "customError",
        props: {
            id: uuid.v4(),
            title: i18n.t('errors.title'),
            subtitle: message,
            details: details,
        },
    });
}

export function showToastTransaction(transaction: Transaction, pending: boolean = false) {
    Toast.show({
        type: "transaction",
        props: {
            id: transaction.txHash,
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
            id={props.id}
            title={props.title}
            subtitle={props.subtitle}
            details={props.details}
        />
    ),
    transaction: ({ props }) => (
        <TransactionToast
            id={props.id}
            transaction={props.transaction}
            pending={props.pending}
        />
    ),
    networkChange: ({ props }) => (
        <NetworkChangeToast
            networkId={props.networkId}
        />
    )
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