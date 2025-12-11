import Identifiable from "@/types/Identifiable";
import { TokenContract } from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";

export class SwapToken implements TokenContract, Identifiable {
    constructor(
        public readonly assetId: string,
        public readonly decimals: number,
        public readonlyblockchain: SwapTokenChain,
        public readonly logo: URL | null,
        public readonly symbol: string,
        public readonly price: number,
        public readonly priceUpdatedAt: string,
        public readonly contractAddress: TokenAddress,
        public readonly name: string | null,
    ) {}


    get priceInUsd(): number | null {
        return this.price;
    }

    get id(): string | number {
        return this.assetId;
    }
    
    // TODO: Add name to token
    static fromTokenResponse(token: TokenResponse, image: string | null): SwapToken {
        const contractAddress = TokenAddress.create(token.contractAddress ?? "");

        return new SwapToken(
            token.assetId,
            token.decimals,
            token.blockchain.toUpperCase() as SwapTokenChain,
            image ? new URL(image) : null,
            token.symbol,
            token.price,
            token.priceUpdatedAt,
            contractAddress,
            token.symbol,
        );
    }
}

export type SwapTokenChain = keyof typeof TokenResponse.blockchain;