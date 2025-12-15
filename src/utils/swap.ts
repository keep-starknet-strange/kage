import Amount from "@/types/amount";
import Identifiable from "@/types/Identifiable";
import { TokenContract } from "@/types/token";
import { TokenBalance } from "@/types/tokenBalance";
import { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";

export class SwapToken implements TokenContract, Identifiable {
    constructor(
        public readonly assetId: string,
        public readonly decimals: number,
        public readonly blockchain: SwapTokenChain,
        public readonly logo: URL | null,
        public readonly symbol: string,
        public readonly price: number,
        public readonly priceUpdatedAt: string,
        public readonly contractAddress: string,
        public readonly name: string | null,
    ) {}


    get priceInUsd(): number | null {
        return this.price;
    }

    get id(): string | number {
        return this.assetId;
    }
    
    // TODO: Add name to token
    static fromTokenResponse(token: TokenResponse, image: string | null): SwapToken | null {
        if (!token.contractAddress) {
            return null;
        }

        return new SwapToken(
            token.assetId,
            token.decimals,
            token.blockchain.toUpperCase() as SwapTokenChain,
            image ? new URL(image) : null,
            token.symbol,
            token.price,
            token.priceUpdatedAt,
            token.contractAddress,
            token.symbol,
        );
    }
}

export type SwapTokenChain = keyof typeof TokenResponse.blockchain;

export class SwapTokenBalance extends TokenBalance<SwapToken> {}

export class SwapAmount extends Amount<SwapToken> {}