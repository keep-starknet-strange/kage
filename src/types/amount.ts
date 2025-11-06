import Token from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { tokenAmountToFormatted } from "@/utils/formattedBalance";

export default abstract class Amount {
    readonly amount: bigint;
    readonly token: Token;

    constructor(amount: bigint, token: Token) {
        this.amount = amount;
        this.token = token;
    }

    formatted(): string {
        return tokenAmountToFormatted(false, this.amount, this.token);
    }
}

export class PublicAmount extends Amount {
    constructor(amount: bigint, token: Token) {
        super(amount, token);
    }

    static fromTokenBalance(balance: PublicTokenBalance, amount: bigint): PublicAmount {
        return new PublicAmount(amount, balance.token);
    }
}

export class PrivateAmount extends Amount {
    private readonly rate: bigint;

    constructor(amount: bigint, token: Token, rate: bigint) {
        super(amount, token);
        this.rate = rate;
    }

    toSdkAmount(): bigint {
        // return this.amount * this.rate;
        return 0n;
    }

    static fromTokenBalance(balance: PrivateTokenBalance, amount: bigint): PrivateAmount {
        return new PrivateAmount(amount, balance.token, balance.rate);
    }
}