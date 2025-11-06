import Account from "@/profile/account";
import { PrivateAmount, PublicAmount } from "@/types/amount";
import PrivateTokenAddress from "@/types/privateRecipient";
import { PrivateTransaction } from "@/types/transaction";
import { Account as TongoAccount } from "@fatsolutions/tongo-sdk";
import { Account as StarknetAccount } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "./accessVaultStore";
import { useBalanceStore } from "./balance/balanceStore";
import { useRpcStore } from "./useRpcStore";

export interface TxState {
    pendingTransactionsStack: PrivateTransaction[];

    completedTransactions: PrivateTransaction[];

    fund: (from: Account, amount: PublicAmount, signer: Account) => Promise<void>;

    transfer: (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenAddress) => Promise<void>;

    withdraw: (to: Account, amount: PrivateAmount, signer: Account) => Promise<void>;

    appendPendingTransaction: (transaction: PrivateTransaction) => void;

    markTransactionAsCompleted: (transactionHash: string) => void;
}

export const useTxStore = create<TxState>((set, get) => ({
    pendingTransactionsStack: [],
    completedTransactions: [],

    fund: async (from: Account, amount: PublicAmount, signer: Account) => {
        const { requestAccess } = useAccessVaultStore.getState();
        const { provider } = useRpcStore.getState();
        const { appendPendingTransaction, markTransactionAsCompleted } = get();
        const { requestRefresh } = useBalanceStore.getState();

        try {
            const result = await requestAccess({ requestFor: "privateKeys", signing: [signer], tokens: new Map([[from, [amount.token]]]) });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new Error("Signing key not found for account " + signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new Error("Token key not found for account " + from.address);
            }

            const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);
            const sdkRate = await tongoAccount.rate();
            const privateAmount = amount.intoPrivateAmount(sdkRate);

            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
            });

            const fundOp = await tongoAccount.fund({ amount: privateAmount.toSdkAmount() });
            await fundOp.populateApprove();
            const starknetTx = await signerAccount.execute([
                fundOp.approve!,
                fundOp.toCalldata()
            ]);

            appendPendingTransaction({
                type: "fund",
                from: from.address,
                amount: privateAmount,
                signer: signer.address,
                txHash: starknetTx.transaction_hash,
            });

            await provider.waitForTransaction(starknetTx.transaction_hash);

            markTransactionAsCompleted(starknetTx.transaction_hash);

            const accountsToRefresh = [from]
            if (from.address !== signer.address) {
                accountsToRefresh.push(signer);
            }

            await requestRefresh(accountsToRefresh);
        } catch (error) {
            console.error("Error funding account", error);
        }
    },

    transfer: async (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenAddress) => {
        const { requestAccess } = useAccessVaultStore.getState();
        const { provider } = useRpcStore.getState();
        const { appendPendingTransaction, markTransactionAsCompleted } = get();
        const { requestRefresh } = useBalanceStore.getState();

        try {
            const result = await requestAccess({ requestFor: "privateKeys", signing: [signer], tokens: new Map([[from, [amount.token]]]) });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new Error("Signing key not found for account " + signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new Error("Token key not found for account " + from.address);
            }

            const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);
            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
            });

            const transferOp = await tongoAccount.transfer({
                to: recipient.pubKey,
                amount: amount.toSdkAmount()
            });
            
            const starknetTx = await signerAccount.execute(transferOp.toCalldata());

            appendPendingTransaction({
                type: "transfer",
                from: from.address,
                amount: amount,
                signer: signer.address,
                recipient: recipient,
                txHash: starknetTx.transaction_hash,
            });

            await provider.waitForTransaction(starknetTx.transaction_hash);

            markTransactionAsCompleted(starknetTx.transaction_hash);

            const accountsToRefresh = [from]
            if (from.address !== signer.address) {
                accountsToRefresh.push(signer);
            }

            await requestRefresh(accountsToRefresh);
        } catch (error) {
            console.error("Error funding account", error);
        }
    },

    withdraw: async (to: Account, amount: PrivateAmount, signer: Account) => {
        const { requestAccess } = useAccessVaultStore.getState();
        const { provider } = useRpcStore.getState();
        const { appendPendingTransaction, markTransactionAsCompleted } = get();
        const { requestRefresh } = useBalanceStore.getState();

        try {
            const result = await requestAccess({ requestFor: "privateKeys", signing: [signer], tokens: new Map([[to, [amount.token]]]) });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new Error("Signing key not found for account " + signer.address);
            }

            const tokenKeyPairs = result.tokens.get(to)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new Error("Token key not found for account " + to.address);
            }

            const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);

            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
            });

            const withdrawOp = await tongoAccount.withdraw({ 
                to: to.address,
                amount: amount.toSdkAmount()
            });
            const starknetTx = await signerAccount.execute([
                withdrawOp.toCalldata()
            ]);

            appendPendingTransaction({
                type: "withdraw",
                to: to.address,
                amount: amount,
                signer: signer.address,
                txHash: starknetTx.transaction_hash,
            });

            await provider.waitForTransaction(starknetTx.transaction_hash);

            markTransactionAsCompleted(starknetTx.transaction_hash);

            const accountsToRefresh = [to]
            if (to.address !== signer.address) {
                accountsToRefresh.push(signer);
            }

            await requestRefresh(accountsToRefresh);
        } catch (error) {
            console.error("Error funding account", error);
        }
    },

    appendPendingTransaction: (transaction: PrivateTransaction) => {
        set((state) => ({
            pendingTransactionsStack: [transaction, ...state.pendingTransactionsStack],
        }));
    },

    markTransactionAsCompleted: (transactionHash: string) => {
        const pending = get().pendingTransactionsStack.find((transaction) => transaction.txHash === transactionHash);
        if (!pending) {
            console.warn("Transaction not found in pending transactions stack", transactionHash);
            return
        }

        set((state) => ({
            completedTransactions: [...state.completedTransactions, pending],
            pendingTransactionsStack: state.pendingTransactionsStack.filter((transaction) => transaction.txHash !== transactionHash),
        }));
    },
}));