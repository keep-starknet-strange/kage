import Account, { AccountAddress } from "@/profile/account";
import {PrivateAmount, PublicAmount} from "./amount";
import {PrivateTokenRecipient} from "./privateRecipient";

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
} | {
    type: "publicTransfer",
    from: Account,
    amount: PublicAmount,
    recipient: AccountAddress,
    txHash: string,
}

