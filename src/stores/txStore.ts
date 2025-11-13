import Account, { AccountAddress } from "@/profile/account";
import { PrivateAmount, PublicAmount } from "@/types/amount";
import { PrivateTokenRecipient } from "@/types/privateRecipient";
import { PrivateTransaction } from "@/types/transaction";
import { LOG } from "@/utils/logs";
import { Account as TongoAccount } from "@fatsolutions/tongo-sdk";
import transferAbi from "res/config/trasnfer-abi.json";
import { cairo, Contract, Account as StarknetAccount } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "./accessVaultStore";
import { useRpcStore } from "./useRpcStore";

export interface TxState {
    pendingTransactionsStack: PrivateTransaction[];

    fund: (from: Account, amount: PublicAmount, signer: Account) => Promise<void>;


    publicTransfer: (from: Account, amount: PublicAmount, recipient: AccountAddress) => Promise<void>;
    
    transfer: (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenRecipient) => Promise<void>;

    withdraw: (to: Account, amount: PrivateAmount, signer: Account) => Promise<void>;

    appendPendingTransaction: (transaction: PrivateTransaction) => void;

    removePendingTransaction: (transactionHash: string) => void;
}

export const useTxStore = create<TxState>((set, get) => ({
    pendingTransactionsStack: [],

    fund: async (from: Account, amount: PublicAmount, signer: Account) => {
        const {requestAccess} = useAccessVaultStore.getState();
        const {provider} = useRpcStore.getState();
        const {appendPendingTransaction} = get();

        const result = await requestAccess({
            requestFor: "privateKeys",
            signing: [signer],
            tokens: new Map([[from, [amount.token]]])
        });

        const signerKeyPairs = result.signing.get(signer);
        if (!signerKeyPairs) {
            throw new Error("Signing key not found for account " + signer.address);
        }

        const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
        if (!tokenKeyPairs) {
            throw new Error("Token key not found for account " + from.address);
        }

        // @ts-ignore
        const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);
        const sdkRate = await tongoAccount.rate();
        const privateAmount = amount.intoPrivateAmount(sdkRate);

        const signerAccount = new StarknetAccount({
            provider: provider,
            address: signer.address,
            signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
        });

        LOG.info("[TX]: 🗝 Prooving funding...");
        const fundOp = await tongoAccount.fund({amount: privateAmount.toSdkAmount()});
        await fundOp.populateApprove();
        LOG.info("[TX]: 🚀 Funding account execute...");
        const starknetTx = await signerAccount.execute([
            fundOp.approve!,
            fundOp.toCalldata()
        ]);

        appendPendingTransaction({
            type: "fund",
            from: from,
            amount: privateAmount,
            signer: signer,
            txHash: starknetTx.transaction_hash,
        });
    },


    publicTransfer: async (from: Account, amount: PublicAmount, recipient: AccountAddress) => {
        const {requestAccess} = useAccessVaultStore.getState();
        const {provider} = useRpcStore.getState();
        const {appendPendingTransaction} = get();

        const result = await requestAccess({
            requestFor: "privateKeys",
            signing: [from],
            tokens: new Map()
        });

        const signerKeyPairs = result.signing.get(from);
        if (!signerKeyPairs) {
            throw new Error("Signing key not found for account " + from.address);
        }

        const fromAccount = new StarknetAccount({
            provider: provider,
            address: from.address,
            signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
        });

        const contract = new Contract({
            abi: transferAbi,
            address: amount.token.contractAddress,
            providerOrAccount: fromAccount,
        });

        const tx = await contract.transfer(recipient, cairo.uint256(amount.amount));
        appendPendingTransaction({
            type: "publicTransfer",
            from: from,
            amount: amount,
            recipient: recipient,
            txHash: tx.transaction_hash,
        });
    },

    transfer: async (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenRecipient) => {
        const {requestAccess} = useAccessVaultStore.getState();
        const {provider} = useRpcStore.getState();
        const {appendPendingTransaction} = get();

        const result = await requestAccess({
            requestFor: "privateKeys",
            signing: [signer],
            tokens: new Map([[from, [amount.token]]])
        });

        const signerKeyPairs = result.signing.get(signer);
        if (!signerKeyPairs) {
            throw new Error("Signing key not found for account " + signer.address);
        }

        const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
        if (!tokenKeyPairs) {
            throw new Error("Token key not found for account " + from.address);
        }

        // @ts-ignore
        const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);
        const signerAccount = new StarknetAccount({
            provider: provider,
            address: signer.address,
            signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
        });

        if (amount.needsRollover) {
            LOG.info("[TX]: 🗝 Prooving rollover...");
            const rolloverOp = await tongoAccount.rollover();
            LOG.info("[TX]: 🚀 Rollover execute...");
            const rolloverTx = await signerAccount.execute([rolloverOp.toCalldata()]);
            await provider.waitForTransaction(rolloverTx.transaction_hash);
        }

        LOG.info("[TX]: 🗝 Proving Transfer...");
        const transferOp = await tongoAccount.transfer({
            to: recipient.privateTokenAddress.pubKey,
            amount: amount.toSdkAmount()
        });

        LOG.info("[TX]: 🚀 Transfer execute...");
        const starknetTx = await signerAccount.execute([transferOp.toCalldata()]);

        appendPendingTransaction({
            type: "transfer",
            from: from,
            amount: amount,
            signer: signer,
            recipient: recipient,
            txHash: starknetTx.transaction_hash,
        });
    },

    withdraw: async (to: Account, amount: PrivateAmount, signer: Account) => {
        const {requestAccess} = useAccessVaultStore.getState();
        const {provider} = useRpcStore.getState();
        const {appendPendingTransaction} = get(); 

        const result = await requestAccess({
            requestFor: "privateKeys",
            signing: [signer],
            tokens: new Map([[to, [amount.token]]])
        });

        const signerKeyPairs = result.signing.get(signer);
        if (!signerKeyPairs) {
            throw new Error("Signing key not found for account " + signer.address);
        }

        const tokenKeyPairs = result.tokens.get(to)?.keyPairs;
        if (!tokenKeyPairs) {
            throw new Error("Token key not found for account " + to.address);
        }
        // @ts-ignore
        const tongoAccount = new TongoAccount(tokenKeyPairs.spendingKeyPair.privateSpendingKey, amount.token.tongoAddress, provider);

        const signerAccount = new StarknetAccount({
            provider: provider,
            address: signer.address,
            signer: signerKeyPairs.spendingKeyPair.privateSpendingKey,
        });

        if (amount.needsRollover) {
            LOG.info("[TX]: 🗝 Prooving rollover...");
            const rolloverOp = await tongoAccount.rollover();
            LOG.info("[TX]: 🚀 Rollover execute...");
            const rolloverTx = await signerAccount.execute([rolloverOp.toCalldata()]);
            await provider.waitForTransaction(rolloverTx.transaction_hash);
        }

        LOG.info("[TX]: 🗝 Prooving withdraw...");
        const withdrawOp = await tongoAccount.withdraw({
            to: to.address,
            amount: amount.toSdkAmount()
        });

        LOG.info("[TX]: 🚀 Withdraw execute...");
        const starknetTx = await signerAccount.execute([withdrawOp.toCalldata()]);

        appendPendingTransaction({
            type: "withdraw",
            to: to,
            amount: amount,
            signer: signer,
            txHash: starknetTx.transaction_hash,
        });
    },

    appendPendingTransaction: (transaction: PrivateTransaction) => {
        const {removePendingTransaction} = get();
        const {provider} = useRpcStore.getState();

        LOG.info(`[TX]: 🤝 ${transaction.type}:`, transaction.txHash);

        set((state) => ({
            pendingTransactionsStack: [transaction, ...state.pendingTransactionsStack],
        }));

        provider.waitForTransaction(transaction.txHash)
            .then((receipt) => {
                removePendingTransaction(transaction.txHash);
                LOG.info("[TX]: ✅ Completed: ", transaction.txHash);
                LOG.debug("---- 🧾 Receipt: ", receipt, "for", transaction.txHash);
            }).catch((error) => {
            removePendingTransaction(transaction.txHash);
            console.error("Error waiting for transaction", error);
        });
    },

    removePendingTransaction: (transactionHash: string) => {
        const pending = get().pendingTransactionsStack.find((transaction) => transaction.txHash === transactionHash);
        if (!pending) {
            console.warn("Transaction not found in pending transactions stack", transactionHash);
            return
        }

        set((state) => ({
            pendingTransactionsStack: state.pendingTransactionsStack.filter((transaction) => transaction.txHash !== transactionHash),
        }));
    },
}))