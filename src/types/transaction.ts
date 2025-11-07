import Account, { AccountAddress } from "@/profile/account";
import { MapUtils } from "@/utils/map";
import { PrivateAmount } from "./amount";
import { PrivateTokenRecipient, WalletPrivateTokenRecipient } from "./privateRecipient";
import Token from "./token";

export type PrivateTransaction = {
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
}

export type PrivateTransactionType = "fund" | "transfer" | "withdraw";

export namespace PrivateTransaction {
    export function affectedBalances(
        transaction: PrivateTransaction,
        feeToken: Token
    ): {
        publicBalances: Map<Account, Token[]>,
        privateBalances: Map<Account, Token[]>,
    } {
        const publicBalances = new Map<Account, Token[]>();
        const privateBalances = new Map<Account, Token[]>();

        switch (transaction.type) {
            case "fund":
                MapUtils.update(publicBalances, transaction.from, transaction.amount.token);
                MapUtils.update(privateBalances, transaction.from, transaction.amount.token);

                if (transaction.from !== transaction.signer) {
                    MapUtils.update(publicBalances, transaction.signer, feeToken);
                } else if (transaction.amount.token !== feeToken) {
                    MapUtils.update(publicBalances, transaction.from, feeToken);
                }
                break;
            case "transfer":
                MapUtils.update(privateBalances, transaction.from, transaction.amount.token);
                if (transaction.recipient instanceof WalletPrivateTokenRecipient) {
                    MapUtils.update(privateBalances, transaction.recipient.to, transaction.amount.token);
                }

                MapUtils.update(publicBalances, transaction.signer, feeToken);
                break;
            case "withdraw":
                MapUtils.update(privateBalances, transaction.to, transaction.amount.token);
                MapUtils.update(publicBalances, transaction.to, transaction.amount.token);
                if (transaction.to !== transaction.signer) {
                    MapUtils.update(publicBalances, transaction.signer, feeToken);
                } else if (transaction.amount.token !== feeToken) {
                    MapUtils.update(publicBalances, transaction.to, feeToken);
                }
                break;
        }

        return { publicBalances, privateBalances };
    }
}

