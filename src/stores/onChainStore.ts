import Account, { AccountAddress } from "@/profile/account";
import { PrivateAmount, PublicAmount } from "@/types/amount";
import { PrivateTokenRecipient } from "@/types/privateRecipient";
import { Transaction } from "@/types/transaction";
import { LOG } from "@/utils/logs";
import { Account as TongoAccount } from "@fatsolutions/tongo-sdk";
import transferAbi from "res/config/trasnfer-abi.json";
import { cairo, CallData, Contract, RpcError, Account as StarknetAccount } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "./accessVaultStore";
import { useRpcStore } from "./useRpcStore";
import { AppError } from "@/types/appError";
import { showToastError, showToastTransaction } from "@/components/ui/toast";
import { useAppDependenciesStore } from "./appDependenciesStore";
import KeyValueStorage from "@/storage/kv/KeyValueStorage";

export type DeployedStatus = "deployed" | "deploying" | "not-deployed" | "unknown";

const OZ_ACCOUNT_CLASS_HASH = "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564";

export interface OnChainState {
    pendingTransactionsStack: Transaction[];
    deployStatus: ReadonlyMap<AccountAddress, DeployedStatus>;

    fund: (from: Account, amount: PublicAmount, signer: Account) => Promise<void>;

    publicTransfer: (from: Account, amount: PublicAmount, recipient: AccountAddress) => Promise<void>;

    transfer: (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenRecipient) => Promise<void>;

    withdraw: (to: Account, amount: PrivateAmount, signer: Account) => Promise<void>;

    checkAccountsDeployed: (accounts: Account[]) => Promise<void>;

    deployAccount: (account: Account) => Promise<void>;

    appendPendingTransaction: (transaction: Transaction) => void;

    removePendingTransaction: (transactionHash: string) => void;

    reset(): void;
}

export const useOnChainStore = create<OnChainState>((set, get) => {
    const updateStatus = (status: ReadonlyMap<AccountAddress, DeployedStatus>, account: Account, newStatus: DeployedStatus): ReadonlyMap<AccountAddress, DeployedStatus> => {
        const updated = new Map(status);
        updated.set(account.address, newStatus);
        return updated;
    }

    const readStoredClassHashes = async (keyValueStorage: KeyValueStorage): Promise<Map<AccountAddress, string>> => {
        const stored = await keyValueStorage.get("accounts.classHashes")
        if (stored) {
            return new Map(Object.entries(stored).map(([address, classHash]) => [AccountAddress.fromHex(address), classHash]));
        } else {
            return new Map();
        }
    }

    const writeStoredClassHashes = async (keyValueStorage: KeyValueStorage, classHashes: Map<AccountAddress, string>) => {
        await keyValueStorage.set("accounts.classHashes", Object.fromEntries(classHashes.entries()));
    }

    return {
        pendingTransactionsStack: [],
        deployStatus: new Map(),

        fund: async (from: Account, amount: PublicAmount, signer: Account) => {
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();
            const { appendPendingTransaction } = get();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[from, [amount.token]]])
            });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new AppError("Signing key not found for account", signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new AppError("Token key not found for account", from.address);
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
            const fundOp = await tongoAccount.fund({ amount: privateAmount.toSdkAmount() });
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
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();
            const { appendPendingTransaction } = get();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [from],
                tokens: new Map()
            });

            const signerKeyPairs = result.signing.get(from);
            if (!signerKeyPairs) {
                throw new AppError("Signing key not found for account", from.address);
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
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();
            const { appendPendingTransaction } = get();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[from, [amount.token]]])
            });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new AppError("Signing key not found for account", signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new AppError("Token key not found for account", from.address);
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
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();
            const { appendPendingTransaction } = get();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[to, [amount.token]]])
            });

            const signerKeyPairs = result.signing.get(signer);
            if (!signerKeyPairs) {
                throw new AppError("Signing key not found for account", signer.address);
            }

            const tokenKeyPairs = result.tokens.get(to)?.keyPairs;
            if (!tokenKeyPairs) {
                throw new AppError("Token key not found for account", to.address);
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

        checkAccountsDeployed: async (accounts: Account[]) => {
            const { provider } = useRpcStore.getState();
            const { keyValueStorage } = useAppDependenciesStore.getState();

            const deployedAccounts: Map<AccountAddress, DeployedStatus> = new Map();
            try {
                const storedClassHashes = await readStoredClassHashes(keyValueStorage);
                const classHashes = await Promise.all(
                    accounts.map(account => {
                        const storedClassHash = storedClassHashes.get(account.address);
                        if (storedClassHash) {
                            return Promise.resolve(storedClassHash);
                        }

                        console.log("Getting class hash for account", account.address);
                        return provider
                            .getClassHashAt(account.address)
                            .catch(error => {
                                if (error instanceof RpcError && error.isType("CONTRACT_NOT_FOUND")) {
                                    console.log("Contract not found for account", account.address);
                                    return null;
                                } else {
                                    throw error;
                                }
                            })
                    })
                );

                storedClassHashes.clear();
                for (const [i, classHash] of classHashes.entries()) {
                    if (classHash) {
                        storedClassHashes.set(accounts[i].address, classHash);
                    }

                    deployedAccounts.set(accounts[i].address, classHash ? "deployed" : "not-deployed");
                }

                await writeStoredClassHashes(keyValueStorage, storedClassHashes);
            } catch (error) {
                for (const account of accounts) {
                    deployedAccounts.set(account.address, "unknown");
                }
                showToastError(error);
            }

            set({ deployStatus: deployedAccounts });
        },

        deployAccount: async (account: Account) => {
            const { deployStatus, appendPendingTransaction } = get();
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();

            const status = deployStatus.get(account.address);
            if (status === "deployed" || status === "unknown") {
                return;
            }

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [account],
                tokens: new Map()
            });

            const keyPairs = result.signing.get(account);
            if (!keyPairs) {
                throw new Error("Signing key not found for account " + account.address);
            }

            const starknetAccount = new StarknetAccount({
                provider: provider,
                address: account.address,
                signer: keyPairs.spendingKeyPair.privateSpendingKey,
            });

            const deployTx = await starknetAccount.deploySelf({
                classHash: OZ_ACCOUNT_CLASS_HASH,
                constructorCalldata: CallData.compile({ publicKey: keyPairs.spendingKeyPair.publicSpendingKey }),
            });

            appendPendingTransaction({
                type: "deployAccount",
                account: account,
                txHash: deployTx.transaction_hash,
            });
        },

        appendPendingTransaction: (transaction: Transaction) => {
            const { removePendingTransaction } = get();
            const { provider } = useRpcStore.getState();

            if (transaction.type === "deployAccount") {
                set({ deployStatus: updateStatus(get().deployStatus, transaction.account, "deploying") });
            }

            showToastTransaction(transaction, true);

            set((state) => ({
                pendingTransactionsStack: [transaction, ...state.pendingTransactionsStack],
            }));

            provider.waitForTransaction(transaction.txHash)
                .then((receipt) => {
                    showToastTransaction(transaction);
                    removePendingTransaction(transaction.txHash);

                    if (transaction.type === "deployAccount") {
                        set({ deployStatus: updateStatus(get().deployStatus, transaction.account, "deployed") });
                    }
                    LOG.info("[TX]: ✅ Completed: ", transaction.txHash);
                    LOG.debug("---- 🧾 Receipt: ", receipt, "for", transaction.txHash);
                }).catch((error) => {
                    removePendingTransaction(transaction.txHash);
                    showToastError(error);

                    if (transaction.type === "deployAccount") {
                        set({ deployStatus: updateStatus(get().deployStatus, transaction.account, "not-deployed") });
                    }
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

        reset: () => {
            set({ deployStatus: new Map(), pendingTransactionsStack: [] });
        }
    }
})