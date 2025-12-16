import { SwapAmount, SwapToken } from "@/utils/swap"
import { create } from "zustand"
import { useProfileStore } from "./profileStore";
import { useAppDependenciesStore } from "./appDependenciesStore";
import { ProfileState } from "@/profile/profileState";
import { AppError } from "@/types/appError";
import i18n from "@/utils/i18n";
import tokensConfig from "res/config/tokens.json";
import { NetworkId } from "@/profile/misc";
import Token from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { Quote, SwapStatus } from "@/types/swap";
import Account, { AccountAddress } from "@/profile/account";
import { useOnChainStore } from "./onChainStore";
import { tokenAmountToFormatted } from "@/utils/formattedBalance";
import { showToastTransaction } from "@/components/ui/toast";

type PresetNetworkId = keyof typeof tokensConfig;

export interface SwapStore {
    readonly operatingTokens: ReadonlyMap<TokenAddress, Token>;
    readonly sellTokens: SwapToken[];
    readonly buyTokens: SwapToken[];

    fetchTokens: () => Promise<void>;

    requestQuote: (
        action: "sell" | "buy",
        starknetAddress: AccountAddress,
        amount: SwapAmount,
        resultToken: SwapToken,
        slippage: number
    ) => Promise<Quote>;

    performSwap: (
        action: "sell" | "buy",
        fromAccount: Account,
        recipientAddress: string,
        amount: SwapAmount,
        resultToken: SwapToken,
        slippage: number
    ) => Promise<{ quote: Quote, txHash: string }>;
}

export const useSwapStore = create<SwapStore>((set) => {

    const getOperatedTokens = (networkId: NetworkId): Map<TokenAddress, Token> => {
        const presetExists = Object.prototype.hasOwnProperty.call(tokensConfig, networkId);
        if (!presetExists) {
            throw new AppError(i18n.t('errors.networkNotConfigured', { networkId }));
        }
        const preset = tokensConfig[networkId as PresetNetworkId];
        return new Map(preset.tokens.map((token) => {
            const address = TokenAddress.create(token.erc20);
            return [address, new Token(address, token.tongo, token.symbol, token.decimals)]
        }));
    }

    return {
        operatingTokens: new Map(),
        sellTokens: [],
        buyTokens: [],

        fetchTokens: async () => {
            const { swapRepository } = useAppDependenciesStore.getState();
            const { profileState } = useProfileStore.getState();

            if (!ProfileState.isProfile(profileState)) {
                throw new AppError(i18n.t('errors.profileNotInitialized'), profileState);
            }

            const networkId = profileState.currentNetwork.networkId;
            const operatingTokens = getOperatedTokens(networkId);

            const sellTokens = await swapRepository.getAvailableTokens({ type: "sell", availableTokens: Array.from(operatingTokens.values()) });
            const buyTokens = await swapRepository.getAvailableTokens({ type: "buy" });

            set({ operatingTokens, sellTokens, buyTokens });
        },

        requestQuote: async (
            action: "sell" | "buy",
            starknetAddress: AccountAddress,
            amount: SwapAmount,
            resultToken: SwapToken,
            slippage: number
        ) => {
            const { swapRepository } = useAppDependenciesStore.getState();
            return await swapRepository.requestQuote({
                dry: true,
                starknetAddress: starknetAddress,
                recipientAddress: "",
                action: action,
                amount: amount,
                destinationToken: resultToken,
                slippage: slippage,
            });
        },

        performSwap: async (
            action: "sell" | "buy",
            fromAccount: Account,
            recipientAddress: string,
            amount: SwapAmount,
            resultToken: SwapToken,
            slippage: number
        ) => {
            const { depositForSwap } = useOnChainStore.getState();
            const { swapRepository } = useAppDependenciesStore.getState();
            const quote = await swapRepository.requestQuote({
                dry: false,
                starknetAddress: fromAccount.address,
                recipientAddress: recipientAddress,
                action: action,
                amount: amount,
                destinationToken: resultToken,
                slippage: slippage,
            });

            if (!quote.depositAddress) {
                throw new AppError(i18n.t('errors.swapDepositAddressNotAvailable'));
            }

            const txHash = await depositForSwap(
                quote,
                fromAccount,
                amount.token,
            );

            const status = await swapRepository.depositSubmit(txHash, quote.depositAddress);
            const resultAmount = new SwapAmount(BigInt(quote.amountOut), resultToken);
            showToastTransaction({
                type: "swap",
                from: fromAccount,
                recipientAddress: recipientAddress,
                originAmountFormatted: amount.formatted(),
                destinationAmountFormatted: resultAmount.formatted(),
                status: status,
                txHash: txHash,
            });

            if (status === SwapStatus.PENDING) {
                const depositAddress = quote.depositAddress;

                // Fire and forget - poll status independently
                (async () => {
                    const { swapRepository } = useAppDependenciesStore.getState();
                    const POLL_INTERVAL_MS = 3000;
                    let currentStatus: SwapStatus = status;

                    while (currentStatus === SwapStatus.PENDING) {
                        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
                        currentStatus = await swapRepository.checkSwapStatus(depositAddress);

                        showToastTransaction({
                            type: "swap",
                            from: fromAccount,
                            recipientAddress: recipientAddress,
                            originAmountFormatted: amount.formatted(),
                            destinationAmountFormatted: resultAmount.formatted(),
                            status: status,
                            txHash: txHash,
                        });
                    }

                    showToastTransaction({
                        type: "swap",
                        from: fromAccount,
                        recipientAddress: recipientAddress,
                        originAmountFormatted: amount.formatted(),
                        destinationAmountFormatted: resultAmount.formatted(),
                        status: status,
                        txHash: txHash,
                    });
                })();
            }

            return { quote, txHash };
        }
    }
})