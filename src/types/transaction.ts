import { AccountAddress } from "@/profile/account";
import { PrivateAmount } from "./amount";
import PrivateTokenAddress from "./privateRecipient";

export type PrivateTransaction = {
    type: "fund",
    from: AccountAddress,
    amount: PrivateAmount,
    signer: AccountAddress,
    txHash: string,
} | {
    type: "transfer",
    from: AccountAddress,
    amount: PrivateAmount,
    signer: AccountAddress,
    recipient: PrivateTokenAddress,
    txHash: string,
} | {
    type: "withdraw",
    to: AccountAddress,
    amount: PrivateAmount,
    signer: AccountAddress,
    txHash: string,
}

export type PrivateTransactionType = "fund" | "transfer" | "withdraw";

