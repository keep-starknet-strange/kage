import Account, { AccountAddress } from "@/profile/account";
import { PrivateAmount, PublicAmount } from "./amount";
import { PrivateTokenRecipient } from "./privateRecipient";

export type Transaction = {
    type: "fund",
    from: Account,
    amount: PrivateAmount,
    signer: Account,
    txHash: string,
} | {
    type: "transfer",
    from: Account,
    amount: PrivateAmount,
    signer: Account,
    recipient: PrivateTokenRecipient,
    txHash: string,
} | {
    type: "withdraw",
    to: Account,
    amount: PrivateAmount,
    signer: Account,
    txHash: string,
} | {
    type: "deployAccount",
    account: Account,
    txHash: string,
} | {
    type: "publicTransfer",
    from: Account,
    amount: PublicAmount,
    recipient: AccountAddress,
    txHash: string,
}

export type SerializableTransaction = {
    type: "fund",
    from: Account,
    amountFormatted: string,
    signer: Account,
    txHash: string,
} | {
    type: "transfer",
    from: Account,
    amountFormatted: string,
    signer: Account,
    recipient: PrivateTokenRecipient,
    txHash: string,
} | {
    type: "withdraw",
    to: Account,
    amountFormatted: string,
    signer: Account,
    txHash: string,
} | {
    type: "deployAccount",
    account: Account,
    txHash: string,
} | {
    type: "publicTransfer",
    from: Account,
    amountFormatted: string,
    recipient: AccountAddress,
    txHash: string,
}

export namespace Transaction {
    export function toSerializable(transaction: Transaction): SerializableTransaction {
        switch (transaction.type) {
            case "fund":
                return {
                    type: "fund",
                    from: transaction.from,
                    amountFormatted: transaction.amount.formatted(),
                    signer: transaction.signer,
                    txHash: transaction.txHash,
                };
            case "transfer":
                return {
                    type: "transfer",
                    from: transaction.from,
                    amountFormatted: transaction.amount.formatted(),
                    signer: transaction.signer,
                    recipient: transaction.recipient,
                    txHash: transaction.txHash,
                };
            case "withdraw":
                return {
                    type: "withdraw",
                    to: transaction.to,
                    amountFormatted: transaction.amount.formatted(),
                    signer: transaction.signer,
                    txHash: transaction.txHash,
                };
            case "deployAccount":
                return {
                    type: "deployAccount",
                    account: transaction.account,
                    txHash: transaction.txHash,
                };
            case "publicTransfer":
                return {
                    type: "publicTransfer",
                    from: transaction.from,
                    amountFormatted: transaction.amount.formatted(),
                    recipient: transaction.recipient,
                    txHash: transaction.txHash,
                };
        }
    }
}