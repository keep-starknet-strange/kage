// https://starknet.impulse.avnu.fi/v3/tokens/

import { TokenMetadata } from "@/types/token";
import { LOG } from "./logs";
import { TokenAddress } from "@/types/tokenAddress";

const TOKENS_URL = "https://starknet.impulse.avnu.fi/v3/tokens";
const PRICES_URL = "https://starknet.impulse.avnu.fi/v3/tokens/prices";

export async function getTokenMetadata(tokenAddresses: TokenAddress[]): Promise<Map<TokenAddress, TokenMetadata>> {
    const metadataPromises = tokenAddresses.map(tokenAddress => {
        return fetch(`${TOKENS_URL}/${tokenAddress}`)
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
                LOG.error(`Failed to fetch token metadata for ${tokenAddress}`, error);
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

type TokenPriceItem = {
    "address": string,
    "decimals": number,
    "globalMarket": {
        "usd": number
    },
    "starknetMarket": {
        "usd": number
    }
}

export async function getTokenPrices(tokenAddresses: TokenAddress[]): Promise<Map<TokenAddress, number | null>> {
    const response = await fetch(`${PRICES_URL}`, {
        method: 'POST',
        body: JSON.stringify({
            tokens: tokenAddresses.map((a) => a.toString())
        })
    })

    if (!response.ok) {
        LOG.error(`Failed to fetch token prices: ${response.statusText}`);
        return new Map(tokenAddresses.map(address => [address, null]));
    }

    const dataJson: TokenPriceItem[] = await response.json();
    const data = new Map(dataJson.map((item: TokenPriceItem) => [TokenAddress.create(item.address), item.starknetMarket.usd]));

    return new Map(tokenAddresses.map(address => {
        const price = data.get(address) ?? null;
        return [address, price];
    }));

}