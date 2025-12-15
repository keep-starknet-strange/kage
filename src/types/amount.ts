import Token, { TokenContract } from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { min } from "@/utils/bigint";
import { tokenAmountToFormatted } from "@/utils/formattedBalance";

export default abstract class Amount<T extends TokenContract> {
    readonly amount: bigint;
    readonly token: T;

    constructor(amount: bigint, token: T) {
        this.amount = amount;
        this.token = token;
    }

    formatted(): string {
        return tokenAmountToFormatted(false, this.amount, this.token);
    }
}

export class PublicAmount extends Amount<Token> {
    constructor(amount: bigint, token: Token) {
        super(amount, token);
    }

    static fromTokenBalance(balance: PublicTokenBalance, amount: bigint): PublicAmount {
        return new PublicAmount(amount, balance.token);
    }

    intoPrivateAmount(rate: bigint): PrivateAmount {
        return new PrivateAmount(this.amount, 0n, this.token, rate);
    }
}

export class PrivateAmount extends Amount<Token> {
    private readonly rate: bigint;
    readonly amountFromPendingBalance: bigint;

    constructor(
        amount: bigint, 
        amountFromPendingBalance: bigint,
        token: Token, 
        rate: bigint
    ) {
        const total = amount + amountFromPendingBalance;
        super(total, token);
        this.amountFromPendingBalance = amountFromPendingBalance;
        this.rate = rate;
    }

    // WARNING: Loses precision.
    toSdkAmount(): bigint {
        return this.amount / this.rate;
    }

    get needsRollover(): boolean {
        return this.amountFromPendingBalance > 0n;
    }
    
    static fromTokenBalance(balance: PrivateTokenBalance, amount: bigint): PrivateAmount {
        const claimed = min(balance.claimedBalance, amount);
        const amountFromPendingBalance = claimed < amount ? amount - claimed : 0n;
        return new PrivateAmount(claimed, amountFromPendingBalance, balance.token, balance.rate);
    }
}