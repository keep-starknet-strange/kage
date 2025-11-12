import Account, { AccountAddress } from "@/profile/account";
import { CallData, RpcError, Account as StarknetAccount } from "starknet";
import { create } from "zustand";
import { useRpcStore } from "./useRpcStore";
import { LOG } from "@/utils/logs";
import { useAccessVaultStore } from "./accessVaultStore";

export type DeployedStatus = "deployed" | "deploying" | "not-deployed" | "unknown";

const OZ_ACCOUNT_CLASS_HASH = "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564";

export interface AccountsState {
    status: ReadonlyMap<AccountAddress, DeployedStatus>;

    checkAccountsDeployed: (accounts: Account[]) => Promise<void>;

    deployAccount: (account: Account) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => {
    const updateStatus = (status: ReadonlyMap<AccountAddress, DeployedStatus>, account: Account, newStatus: DeployedStatus): ReadonlyMap<AccountAddress, DeployedStatus> => {
        const updated = new Map(status);
        updated.set(account.address, newStatus);
        return updated;
    }

    return {
        status: new Map(),

        checkAccountsDeployed: async (accounts: Account[]) => {
            const { provider } = useRpcStore.getState();

            const deployedAccounts: Map<AccountAddress, DeployedStatus> = new Map();
            try {
                const classHashes = await Promise.all(
                    accounts.map(account => provider
                        .getClassHashAt(account.address)
                        .catch(error => {
                            if (error instanceof RpcError && error.isType("CONTRACT_NOT_FOUND")) {
                                console.log("Contract not found for account", account.address);
                                return null;
                            } else {
                                throw error;
                            }
                        }))
                );

                for (const [i, classHash] of classHashes.entries()) {
                    deployedAccounts.set(accounts[i].address, classHash ? "deployed" : "not-deployed");
                }
            } catch (error) {
                LOG.error("[Accounts]:", error);
                for (const account of accounts) {
                    deployedAccounts.set(account.address, "unknown");
                }
            }

            set({ status: deployedAccounts });
        },

        deployAccount: async (account: Account) => {
            const { status: deployedAccounts } = get();
            const { requestAccess } = useAccessVaultStore.getState();
            const { provider } = useRpcStore.getState();

            const status = deployedAccounts.get(account.address);
            if (status === "deployed" || status === "unknown") {
                return;
            }

            set({ status: updateStatus(deployedAccounts, account, "deploying") });

            try {
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

                await provider.waitForTransaction(deployTx.transaction_hash);

                set({ status: updateStatus(deployedAccounts, account, "deployed") });
            } catch (error) {
                LOG.error(`Failed to deploy account ${account.address}:`, error);
                set({ status: updateStatus(deployedAccounts, account, "not-deployed") });
            }
        }
    }
});