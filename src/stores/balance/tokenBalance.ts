import Token from "./token";

abstract class TokenBalance {
    readonly token: Token;
    readonly spendableBalance: bigint;

    constructor(token: Token, balance: bigint) {
        this.token = token;
        this.spendableBalance = balance;
    }

    // TODO: Current implementation loses precision when converting to float
    // Better approach is to use Intl.NumberFormat.formatToParts but this currently seems to not be polyfilled for React Native
    formattedSpendableBalance(compressed: boolean = false): string {
        return this.formattedBalance(compressed, this.spendableBalance);
    }

    protected formattedBalance(compressed: boolean = false, balance: bigint): string {
        const divisor = BigInt(10) ** BigInt(this.token.decimals);
        const integerPart = (balance / divisor).toString();
        const fractionalPart = (balance % divisor).toString().padStart(this.token.decimals, '0');
        const maxFractionDigits = compressed ? Math.min(4, this.token.decimals) : this.token.decimals;

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

export class PublicTokenBalance extends TokenBalance {
    constructor(token: Token, balance: bigint) {
        super(token, balance);
    }
}

export class PrivateTokenBalance extends TokenBalance {
    private pendingBalance: bigint;

    constructor(token: Token, balance: bigint, pendingBalance: bigint) {
        super(token, balance);
        this.pendingBalance = pendingBalance;
    }

    formattedPendingBalance(compressed: boolean = false): string {
        return this.formattedBalance(compressed, this.pendingBalance);
    }
}