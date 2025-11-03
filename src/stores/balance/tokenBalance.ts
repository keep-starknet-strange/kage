import Token from "./token";
import { AccountState as TongoBalanceState } from "@fatsolutions/tongo-sdk";

export abstract class TokenBalance {
    readonly token: Token;
    protected readonly spendableBalance: bigint;

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
    private readonly isUnlocked: boolean;

    /**
     * The pending balance of the token in ERC20 units
     */
    private readonly pendingBalance: bigint;
    
    /**
     * The rate of the token in ERC20 units per Tongo unit
     */
    private readonly rate: bigint;
    /**
     * The decrypted balance of the token in Tongo units
     */
    private readonly decryptedBalance: bigint;
    /**
     * The decrypted pending balance of the token in Tongo units
     */
    private readonly decryptedPendingBalance: bigint;

    constructor(
        token: Token, 
        rate: bigint, 
        decryptedBalance: bigint,
        decryptedPendingBalance: bigint,
        isUnlocked: boolean
    ) {
        super(token, PrivateTokenBalance.convertToERC20Balance(decryptedBalance, rate));
        
        this.rate = rate;
        this.decryptedBalance = decryptedBalance;
        this.decryptedPendingBalance = decryptedPendingBalance;
        this.isUnlocked = isUnlocked;

        this.pendingBalance = PrivateTokenBalance.convertToERC20Balance(decryptedPendingBalance, rate);
    }

    formattedPendingBalance(compressed: boolean = false): string {
        if (!this.isUnlocked) {
            return "LOCKED";
        }

        return super.formattedBalance(compressed, this.pendingBalance);
    }

    formattedBalance(compressed: boolean = false): string {
        if (!this.isUnlocked) {
            return "LOCKED";
        }

        return super.formattedBalance(compressed, this.spendableBalance);
    }

    get unlockedBalance(): bigint | null {
        return this.isUnlocked ? this.spendableBalance : null;
    }

    get unlockedPendingBalance(): bigint | null {
        return this.isUnlocked ? this.pendingBalance : null;
    }

    private static convertToERC20Balance(decryptedBalance: bigint, rate: bigint): bigint {
        return decryptedBalance * rate;
    }

    static locked(token: Token): PrivateTokenBalance {
        return new PrivateTokenBalance(token, 0n, 0n, 0n, false);
    }

    static unlocked(token: Token, rate: bigint, state: TongoBalanceState): PrivateTokenBalance {
        return new PrivateTokenBalance(token, rate, state.balance, state.pending, true);
    }
}