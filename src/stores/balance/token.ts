export default class Token {

    readonly contractAddress: string;
    readonly tongoAddress: string;
    readonly symbol: string;
    readonly decimals: number;

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
}