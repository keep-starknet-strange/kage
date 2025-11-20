import { NetworkId } from "@/profile/misc";
import { TokenMetadata } from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";

export interface MarketRepository {
    getTokenMetadata(
        tokenAddresses: TokenAddress[],
        networkId: NetworkId
    ): Promise<Map<TokenAddress, TokenMetadata>>;

    getTokenPrices(
        tokenAddresses: TokenAddress[],
        networkId: NetworkId
    ): Promise<Map<TokenAddress, number | null>>;
}