import Token from "./token";

export default class TokenBalance {
    readonly token: Token;
    readonly balance: bigint;

    constructor(token: Token, balance: bigint) {
        this.token = token;
        this.balance = balance;
    }

    // TODO: Current implementation loses precision when converting to float
    // Better approach is to use Intl.NumberFormat.formatToParts but this currently seems to not be polyfilled for React Native
    formattedBalance(compressed: boolean = false): string {
        const divisor = BigInt(10) ** BigInt(this.token.decimals);
        const integerPart = (this.balance / divisor).toString();
        const fractionalPart = (this.balance % divisor).toString().padStart(this.token.decimals, '0');
        const maxFractionDigits = compressed ? Math.min(4, this.token.decimals) : this.token.decimals;
        console.log(this.balance / divisor);

        const decimalString = `${integerPart}.${fractionalPart}`;
        const numberValue = parseFloat(decimalString);
        
        const formatter = Intl.NumberFormat('default', {
            style: 'currency',
            currency: 'USD', // This will help replace USD with this token's symbol,
            currencyDisplay: 'code',
            minimumFractionDigits: 0,
            maximumFractionDigits: maxFractionDigits,
        });

        const formattedUSDLike = formatter.format(numberValue);
        return formattedUSDLike.replace('USD', this.token.symbol);
    }
}