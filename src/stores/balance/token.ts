import Identifiable from "@/types/Identifiable";
import formattedAddress from "@/utils/formattedAddress";

export default class Token implements Identifiable {

    readonly contractAddress: string;
    readonly tongoAddress: string;
    readonly symbol: string;
    readonly decimals: number;

    private _formattedContractAddress: string | null = null;
    private _formattedTongoAddress: string | null = null;

    constructor(
        contractAddress: string,
        tongoAddress: string,
        symbol: string,
        decimals: number
    ) {
        this.contractAddress = contractAddress;
        this.tongoAddress = tongoAddress;
        this.symbol = symbol;
        this.decimals = decimals;
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
}