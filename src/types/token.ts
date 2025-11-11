import Identifiable from "@/types/Identifiable";
import formattedAddress from "@/utils/formattedAddress";
import { TokenAddress } from "./tokenAddress";

export default class Token implements Identifiable {

    readonly contractAddress: TokenAddress;
    readonly tongoAddress: string;
    readonly symbol: string;
    readonly decimals: number;
    private readonly metadata: TokenMetadata | null = null;

    private _formattedContractAddress: string | null = null;
    private _formattedTongoAddress: string | null = null;

    constructor(
        contractAddress: TokenAddress,
        tongoAddress: string,
        symbol: string,
        decimals: number,
        metadata: TokenMetadata | null = null
    ) {
        this.contractAddress = contractAddress;
        this.tongoAddress = tongoAddress;
        this.symbol = symbol;
        this.decimals = decimals;
        this.metadata = metadata;
    }

    get formattedContractAddress(): string {
        return this._formattedContractAddress || (this._formattedContractAddress = formattedAddress(this.contractAddress, 'compact'));
    }

    get formattedTongoAddress(): string {
        return this._formattedTongoAddress || (this._formattedTongoAddress = formattedAddress(this.tongoAddress, 'compact'));
    }

    get id(): string {
        return this.contractAddress;
    }

    get logo(): URL | null {
        return this.metadata?.logo ?? null;
    }

    get name(): string | null {
        return this.metadata?.name ?? null;
    }

    get priceInUsd(): number | null {
        return this.metadata?.priceInUsd ?? null;
    }

    withMetadata(metadata: TokenMetadata): Token {
        return new Token(this.contractAddress, this.tongoAddress, this.symbol, this.decimals, metadata);
    }
}

export class TokenMetadata {
    readonly logo: URL | null = null;
    readonly name: string | null = null;
    readonly priceInUsd: number = 0;

    constructor(
        logo: URL | null = null,
        name: string | null = null,
        priceInUsd: number = 0
    ) {
        this.logo = logo;
        this.name = name;
        this.priceInUsd = priceInUsd;
    }
}