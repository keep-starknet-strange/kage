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
import { Quote } from "@/types/swap";
import { AccountAddress } from "@/profile/account";

type PresetNetworkId = keyof typeof tokensConfig;

export interface SwapStore {
    readonly operatingTokens: ReadonlyMap<TokenAddress, Token>;
    readonly sellTokens: SwapToken[];
    readonly buyTokens: SwapToken[];

    fetchTokens: () => Promise<void>;

    requestQuote: (
        action: "sell" | "buy", 
        starknetAddress: AccountAddress,
        recipientAddress: string,
        amount: SwapAmount, 
        resultToken: SwapToken
    ) => Promise<Quote>;
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
            recipientAddress: string,
            amount: SwapAmount, 
            resultToken: SwapToken,
            slippage: number
        ) => {
            const { swapRepository } = useAppDependenciesStore.getState();
            return await swapRepository.requestQuote({
                dry: true,
                starknetAddress: starknetAddress,
                recipientAddress: recipientAddress,
                action: action,
                amount: amount,
                destinationToken: resultToken,
                slippage: slippage,
            });
        }
    }
})