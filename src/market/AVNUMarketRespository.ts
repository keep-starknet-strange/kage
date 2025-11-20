import { AppError } from "@/types/appError";
import { TokenMetadata } from "@/types/token";
import { TokenAddress } from "@/types/tokenAddress";
import { LOG } from "@/utils/logs";
import { MarketRepository } from "./MarketRepository";
import presetTokens from "res/config/tokens.json";
import { NetworkId } from "@/profile/misc";

const TOKENS_URL = "https://starknet.impulse.avnu.fi/v3/tokens";
const PRICES_URL = "https://starknet.impulse.avnu.fi/v3/tokens/prices";

type AVNUTokenPriceItem = {
    "address": string,
    "decimals": number,
    "globalMarket": {
        "usd": number
    },
    "starknetMarket": {
        "usd": number
    }
}

export default class AVNUMarketRepository implements MarketRepository {
    private chainTransformations = new Map<NetworkId, Map<TokenAddress, TokenAddress>>();

    constructor() {
        this.chainTransformations.set("SN_SEPOLIA", new Map(presetTokens.SN_SEPOLIA.avnu.map((transformation) => {
            return [TokenAddress.create(transformation.sepolia), TokenAddress.create(transformation.mainnet)];
        })));
    }

    async getTokenMetadata(
        tokenAddresses: TokenAddress[],
        networkId: NetworkId
    ): Promise<Map<TokenAddress, TokenMetadata>> {
        const transformations = this.chainTransformations.get(networkId) ?? new Map();
        const metadataPromises = tokenAddresses.map(tokenAddress => {
            const transformedTokenAddress = transformations.get(tokenAddress) ?? tokenAddress;

            return fetch(`${TOKENS_URL}/${transformedTokenAddress}`)
                .then(response => {
                    if (!response.ok) {
                        return null;
                    }
                    return response.json();
                })
                .then(data => {
                    return new TokenMetadata(
                        new URL(data.logoUri),
                        data.name,
                        data.starknet.usd
                    );
                })
                .catch(error => {
                    if (transformedTokenAddress !== tokenAddress) {
                        LOG.error(`Failed to fetch token metadata for ${transformedTokenAddress} transformed from ${tokenAddress}`, error);
                    } else {
                        LOG.error(`Failed to fetch token metadata for ${tokenAddress}`, error);
                    }
                    return null;
                });
        })

        return Promise.all(metadataPromises).then(metadataArray => {
            const metadataMap = new Map()

            for (const [i, tokenAddress] of tokenAddresses.entries()) {
                const metadata = metadataArray?.[i];

                if (metadata) {
                    metadataMap.set(tokenAddress, metadata);
                }
            }

            return metadataMap;
        });
    }

    async getTokenPrices(
        tokenAddresses: TokenAddress[],
        networkId: NetworkId
    ): Promise<Map<TokenAddress, number | null>> {
        const transformations = this.chainTransformations.get(networkId) ?? new Map();
        const transformedTokenAddresses = tokenAddresses.map((a) => {
            return transformations.get(a) ?? a;
        });

        const response = await fetch(`${PRICES_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokens: transformedTokenAddresses.map((a) => a.toString())
            })
        })

        if (!response.ok) {
            const error = await response.json();
            throw new AppError("Failed to fetch token prices", error);
        }

        const dataJson: AVNUTokenPriceItem[] = await response.json();
        const data = new Map(dataJson.map((item: AVNUTokenPriceItem) => {
            return [TokenAddress.create(item.address), item.starknetMarket.usd];
        }));

        const prices: Map<TokenAddress, number | null> = new Map();

        for (const [i, address] of tokenAddresses.entries()) {
            const transformedAddress = transformedTokenAddresses[i];
            const price = data.get(transformedAddress) ?? null;
            prices.set(address, price);
        }

        return prices;
    }
}