import { showToastError, showToastTransaction } from "@/components/ui/toast";
import Account, { AccountAddress } from "@/profile/account";
import { ProfileState } from "@/profile/profileState";
import KeyValueStorage from "@/storage/kv/KeyValueStorage";
import { PrivateAmount, PublicAmount } from "@/types/amount";
import { AppError } from "@/types/appError";
import { PrivateTokenRecipient } from "@/types/privateRecipient";
import { Transaction } from "@/types/transaction";
import formattedAddress from "@/utils/formattedAddress";
import i18n from "@/utils/i18n";
import { LOG } from "@/utils/logs";
import { Account as TongoAccount } from "@fatsolutions/tongo-sdk";
import transferAbi from "res/config/trasnfer-abi.json";
import { cairo, CallData, Contract, RpcError, RpcProvider, Account as StarknetAccount, UniversalDetails } from "starknet";
import { create } from "zustand";
import { useAccessVaultStore } from "./accessVaultStore";
import { useAppDependenciesStore } from "./appDependenciesStore";
import { useProfileStore } from "./profileStore";
import { useRpcStore } from "./useRpcStore";
import { Quote } from "@/types/swap";
import { tokenAmountToFormatted } from "@/utils/formattedBalance";
import Token from "@/types/token";
import { SwapAmount, SwapToken } from "@/utils/swap";

export type DeployedStatus = "deployed" | "deploying" | "not-deployed" | "unknown";

export interface OnChainState {
    pendingTransactionsStack: Transaction[];
    deployStatus: ReadonlyMap<AccountAddress, DeployedStatus>;

    fund: (from: Account, amount: PublicAmount, signer: Account) => Promise<void>;

    publicTransfer: (from: Account, amount: PublicAmount, recipient: AccountAddress) => Promise<void>;

    transfer: (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenRecipient) => Promise<void>;

    withdraw: (to: Account, amount: PrivateAmount, signer: Account) => Promise<void>;

    checkAccountsDeployed: (accounts: Account[]) => Promise<void>;

    checkAccountAddressesDeployed: (accountAddress: AccountAddress[], provider: RpcProvider) => Promise<Map<AccountAddress, DeployedStatus>>;

    deployAccount: (account: Account) => Promise<void>;

    depositForSwap: (
        quote: Quote,
        from: Account,
        fromToken: SwapToken,
    ) => Promise<string>;

    appendPendingTransaction: (transaction: Transaction) => Promise<void>;

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
            const { appendPendingTransaction } = get();
            const provider = useRpcStore.getState().getProvider();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[from, [amount.token]]])
            }, {
                title: i18n.t('biometricPrompts.fundingAccount.title'),
                subtitleAndroid: `Authorize to fund account ${formattedAddress(from.address, "compact")}`,
                descriptionAndroid: "KAGE needs your authentication to securely fund your account using your private keys.",
                cancelAndroid: i18n.t('biometricPrompts.fundingAccount.cancelAndroid'),
            });

            const signerKeyPair = result.signing.get(signer);
            if (!signerKeyPair) {
                throw new AppError(i18n.t('errors.signingKeyNotFound'), signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from);
            if (!tokenKeyPairs) {
                throw new AppError(i18n.t('errors.tokenKeyNotFound'), from.address);
            }

            const tokenKeyPair = tokenKeyPairs.find(tokenKeyPair => tokenKeyPair.token.contractAddress === amount.token.contractAddress);
            if (!tokenKeyPair) {
                throw new AppError(`Token key not found for account and token`, JSON.stringify({ account: from.address, token: amount.token.contractAddress }));
            }

            // @ts-ignore
            const tongoAccount = new TongoAccount(tokenKeyPair.keyPair.privateKey, amount.token.tongoAddress, provider);
            const sdkRate = await tongoAccount.rate();
            const privateAmount = amount.intoPrivateAmount(sdkRate);
            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPair.privateKey,
            });

            LOG.info("[TX]: 🗝 Prooving funding...");
            const fundOp = await tongoAccount.fund({ amount: privateAmount.toSdkAmount(), sender: from.address });
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
            }).catch((error) => {
                showToastError(error);
            });
        },


        publicTransfer: async (from: Account, amount: PublicAmount, recipient: AccountAddress) => {
            const { requestAccess } = useAccessVaultStore.getState();
            const { appendPendingTransaction } = get();
            const provider = useRpcStore.getState().getProvider();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [from],
                tokens: new Map()
            }, {
                title: i18n.t('biometricPrompts.publicTransfer.title'),
                subtitleAndroid: `Authorize to transfer ${amount.formatted()} to ${formattedAddress(recipient, "compact")}`,
                descriptionAndroid: "KAGE needs your authentication to securely transfer your public tokens.",
                cancelAndroid: i18n.t('biometricPrompts.publicTransfer.cancelAndroid'),
            });

            const signerKeyPair = result.signing.get(from);
            if (!signerKeyPair) {
                throw new AppError(i18n.t('errors.signingKeyNotFound'), from.address);
            }

            const fromAccount = new StarknetAccount({
                provider: provider,
                address: from.address,
                signer: signerKeyPair.privateKey,
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
            }).catch((error) => {
                showToastError(error);
            });
        },

        transfer: async (from: Account, amount: PrivateAmount, signer: Account, recipient: PrivateTokenRecipient) => {
            const { requestAccess } = useAccessVaultStore.getState();
            const { appendPendingTransaction } = get();
            const provider = useRpcStore.getState().getProvider();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[from, [amount.token]]])
            }, {
                title: i18n.t('biometricPrompts.privateTransfer.title'),
                subtitleAndroid: `Authorize to transfer ${amount.formatted()} to ${formattedAddress(recipient.privateTokenAddress.base58, "compact")}`,
                descriptionAndroid: "KAGE needs your authentication to securely transfer your private tokens.",
                cancelAndroid: i18n.t('biometricPrompts.privateTransfer.cancelAndroid'),
            });

            const signerKeyPair = result.signing.get(signer);
            if (!signerKeyPair) {
                throw new AppError(i18n.t('errors.signingKeyNotFound'), signer.address);
            }

            const tokenKeyPairs = result.tokens.get(from);
            if (!tokenKeyPairs) {
                throw new AppError(i18n.t('errors.tokenKeyNotFound'), from.address);
            }

            const tokenKeyPair = tokenKeyPairs.find(tokenKeyPair => tokenKeyPair.token.contractAddress === amount.token.contractAddress);
            if (!tokenKeyPair) {
                throw new AppError(`Token key not found for account and token`, JSON.stringify({ account: from.address, token: amount.token.contractAddress }));
            }

            // @ts-ignore
            const tongoAccount = new TongoAccount(tokenKeyPair.keyPair.privateKey, amount.token.tongoAddress, provider);
            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPair.privateKey,
            });

            if (amount.needsRollover) {
                LOG.info("[TX]: 🗝 Prooving rollover...");
                const rolloverOp = await tongoAccount.rollover({ sender: from.address });
                LOG.info("[TX]: 🚀 Rollover execute...");
                const rolloverTx = await signerAccount.execute([rolloverOp.toCalldata()]);
                await provider.waitForTransaction(rolloverTx.transaction_hash);
            }

            LOG.info("[TX]: 🗝 Proving Transfer...");
            const transferOp = await tongoAccount.transfer({
                to: recipient.privateTokenAddress.pubKey,
                amount: amount.toSdkAmount(),
                sender: from.address
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
            }).catch((error) => {
                showToastError(error);
            });
        },

        withdraw: async (to: Account, amount: PrivateAmount, signer: Account) => {
            const { requestAccess } = useAccessVaultStore.getState();
            const { appendPendingTransaction } = get();
            const provider = useRpcStore.getState().getProvider();

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [signer],
                tokens: new Map([[to, [amount.token]]])
            }, {
                title: i18n.t('biometricPrompts.withdrawing.title'),
                subtitleAndroid: `Authorize to withdraw ${amount.formatted()} from ${formattedAddress(to.address, "compact")}`,
                descriptionAndroid: "KAGE needs your authentication to securely withdraw your private tokens.",
                cancelAndroid: i18n.t('biometricPrompts.withdrawing.cancelAndroid'),
            });

            const signerKeyPair = result.signing.get(signer);
            if (!signerKeyPair) {
                throw new AppError(i18n.t('errors.signingKeyNotFound'), signer.address);
            }

            const tokenKeyPairs = result.tokens.get(to);
            if (!tokenKeyPairs) {
                throw new AppError(i18n.t('errors.tokenKeyNotFound'), to.address);
            }

            const tokenKeyPair = tokenKeyPairs.find(tokenKeyPair => tokenKeyPair.token.contractAddress === amount.token.contractAddress);
            if (!tokenKeyPair) {
                throw new AppError(`Token key not found for account and token`, JSON.stringify({ account: to.address, token: amount.token.contractAddress }));
            }

            // @ts-ignore
            const tongoAccount = new TongoAccount(tokenKeyPair.keyPair.privateKey, amount.token.tongoAddress, provider);

            const signerAccount = new StarknetAccount({
                provider: provider,
                address: signer.address,
                signer: signerKeyPair.privateKey,
            });

            if (amount.needsRollover) {
                LOG.info("[TX]: 🗝 Prooving rollover...");
                const rolloverOp = await tongoAccount.rollover({ sender: to.address });
                LOG.info("[TX]: 🚀 Rollover execute...");
                const rolloverTx = await signerAccount.execute([rolloverOp.toCalldata()]);
                await provider.waitForTransaction(rolloverTx.transaction_hash);
            }

            LOG.info("[TX]: 🗝 Prooving withdraw...");
            const withdrawOp = await tongoAccount.withdraw({
                to: to.address,
                amount: amount.toSdkAmount(),
                sender: to.address
            });

            LOG.info("[TX]: 🚀 Withdraw execute...");
            const starknetTx = await signerAccount.execute([withdrawOp.toCalldata()]);

            appendPendingTransaction({
                type: "withdraw",
                to: to,
                amount: amount,
                signer: signer,
                txHash: starknetTx.transaction_hash,
            }).catch((error) => {
                showToastError(error);
            });
        },

        checkAccountsDeployed: async (accounts: Account[]) => {
            const { checkAccountAddressesDeployed } = get();
            const provider = useRpcStore.getState().getProvider();

            try {
                const deployedAccounts = await checkAccountAddressesDeployed(accounts.map(account => account.address), provider);
                set({ deployStatus: deployedAccounts });
            } catch (error) {
                const deployedAccounts: Map<AccountAddress, DeployedStatus> = new Map();
                for (const account of accounts) {
                    deployedAccounts.set(account.address, "unknown");
                }
                set({ deployStatus: deployedAccounts });
                throw error;
            }
        },

        checkAccountAddressesDeployed: async (accountAddresses: AccountAddress[], provider: RpcProvider) => {
            const { keyValueStorage } = useAppDependenciesStore.getState();

            const deployedAccounts: Map<AccountAddress, DeployedStatus> = new Map();

            const storedClassHashes = await readStoredClassHashes(keyValueStorage);
            const classHashes = await Promise.all(
                accountAddresses.map(accountAddress => {
                    const storedClassHash = storedClassHashes.get(accountAddress);
                    if (storedClassHash) {
                        return Promise.resolve(storedClassHash);
                    }

                    return provider
                        .getClassHashAt(accountAddress)
                        .catch(error => {
                            if (error instanceof RpcError && error.isType("CONTRACT_NOT_FOUND")) {
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
                    storedClassHashes.set(accountAddresses[i], classHash);
                }

                deployedAccounts.set(accountAddresses[i], classHash ? "deployed" : "not-deployed");
            }

            await writeStoredClassHashes(keyValueStorage, storedClassHashes);

            return deployedAccounts;
        },

        deployAccount: async (account: Account) => {
            const { deployStatus, appendPendingTransaction } = get();
            const { profileState } = useProfileStore.getState();
            const { requestAccess } = useAccessVaultStore.getState();
            const provider = useRpcStore.getState().getProvider();

            if (!ProfileState.isProfile(profileState)) {
                throw new AppError(i18n.t('errors.profileNotInitialized'), profileState);
            }

            const status = deployStatus.get(account.address);
            if (status === "deployed" || status === "unknown") {
                return;
            }

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [account],
                tokens: new Map()
            }, {
                title: i18n.t('biometricPrompts.deployingAccount.title'),
                subtitleAndroid: `Authorize to deploy account ${formattedAddress(account.address, "compact")}`,
                descriptionAndroid: "KAGE needs your authentication to securely deploy your account using your private keys.",
                cancelAndroid: i18n.t('biometricPrompts.deployingAccount.cancelAndroid'),
            });

            const keyPair = result.signing.get(account);
            if (!keyPair) {
                throw new Error(i18n.t('errors.signingKeyNotFound') + " " + account.address);
            }

            const starknetAccount = new StarknetAccount({
                provider: provider,
                address: account.address,
                signer: keyPair.privateKey,
            });

            const deployTx = await starknetAccount.deploySelf({
                classHash: profileState.currentNetworkWithDefinition.networkDefinition.accountClassHash,
                constructorCalldata: CallData.compile({ publicKey: keyPair.publicKey }),
            });

            appendPendingTransaction({
                type: "deployAccount",
                account: account,
                txHash: deployTx.transaction_hash,
            }).catch((error) => {
                showToastError(error);
            });
        },

        depositForSwap: async (
            quote: Quote,
            from: Account,
            fromToken: SwapToken,
        ) => {
            const { appendPendingTransaction } = get();
            const { requestAccess } = useAccessVaultStore.getState();

            if (!quote.depositAddress) {
                throw new AppError(i18n.t('errors.swapDepositAddressNotAvailable'));
            }
            
            const provider = useRpcStore.getState().getProvider();
            const amount = BigInt(quote.amountIn);
            const swapAmount = new SwapAmount(amount, fromToken);

            const result = await requestAccess({
                requestFor: "privateKeys",
                signing: [from],
                tokens: new Map()
            }, {
                title: i18n.t('biometricPrompts.publicTransfer.title'),
                subtitleAndroid: `Authorize to transfer ${swapAmount.formatted()} to initiate the swap`,
                descriptionAndroid: "KAGE needs your authentication to securely transfer your public tokens.",
                cancelAndroid: i18n.t('biometricPrompts.publicTransfer.cancelAndroid'),
            });

            const signerKeyPair = result.signing.get(from);
            if (!signerKeyPair) {
                throw new AppError(i18n.t('errors.signingKeyNotFound'), from.address);
            }

            const fromAccount = new StarknetAccount({
                provider: provider,
                address: from.address,
                signer: signerKeyPair.privateKey,
            });

            const contract = new Contract({
                abi: transferAbi,
                address: fromToken.contractAddress,
                providerOrAccount: fromAccount,
            });

            console.log("Transferring");
            const tx = await contract.transfer(quote.depositAddress, cairo.uint256(swapAmount.amount));
            const origin = tokenAmountToFormatted(false, BigInt(quote.amountIn), fromToken);

            await appendPendingTransaction({
                type: "swapDeposit",
                from: from,
                depositAddress: quote.depositAddress,
                originAmountFormatted: origin,
                txHash: tx.transaction_hash,
            });

            return tx.transaction_hash;
        },

        appendPendingTransaction: async (transaction: Transaction) => {
            const { removePendingTransaction } = get();
            const provider = useRpcStore.getState().getProvider();

            if (transaction.type === "deployAccount") {
                set({ deployStatus: updateStatus(get().deployStatus, transaction.account, "deploying") });
            }

            showToastTransaction(transaction, true);

            set((state) => ({
                pendingTransactionsStack: [transaction, ...state.pendingTransactionsStack],
            }));

            await provider.waitForTransaction(transaction.txHash)
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
                    if (transaction.type === "deployAccount") {
                        set({ deployStatus: updateStatus(get().deployStatus, transaction.account, "not-deployed") });
                    }

                    throw error;
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