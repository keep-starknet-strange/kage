import Identifiable from "@/types/Identifiable";
import Token from "@/types/token";
import { AccountState as TongoBalanceState } from "@fatsolutions/tongo-sdk";
import { fiatBalanceToFormatted, tokenAmountToFormatted } from "@/utils/formattedBalance";
import { PrivateTokenAddress } from "./privateRecipient";
import Account, { AccountAddress } from "@/profile/account";

export function getAggregatedFiatBalance<B extends TokenBalance>(
    accounts: Account[],
    balances: ReadonlyMap<AccountAddress, B[]>
): number {
    return accounts.reduce((total, account) => {
        const accBalances = balances.get(account.address);
        if (!accBalances) {
            return total + 0;
        }

        return total + accBalances.reduce((inAccountTotal, balance) => inAccountTotal + (balance.fiatPrice ?? 0), 0);
    }, 0);
}

export abstract class TokenBalance implements Identifiable {
    readonly token: Token;
    readonly spendableBalance: bigint;
    readonly fiatPrice: number | null;

    constructor(token: Token, balance: bigint) {
        this.token = token;
        this.spendableBalance = balance;

        const usd = this.token.priceInUsd;
        if (usd === null) {
            this.fiatPrice = null;
            return;
        }

        const divisor = 10n ** BigInt(this.token.decimals);
        const tokenAmount = Number(this.spendableBalance) / Number(divisor);
        this.fiatPrice = tokenAmount * usd;
    }

    formattedFiatPrice(): string | null {
        if (this.fiatPrice === null) {
            return null;
        }

        return fiatBalanceToFormatted(this.fiatPrice);
    }

    formattedBalance(compressed: boolean = false, balance: bigint = this.spendableBalance): string {
        return tokenAmountToFormatted(compressed, balance, this.token);
    }

    get id(): string {
        return this.token.contractAddress;
    }
}

export class PublicTokenBalance extends TokenBalance {
    constructor(token: Token, balance: bigint) {
        super(token, balance);
    }

    withUpdatedToken(token: Token): PublicTokenBalance {
        return new PublicTokenBalance(token, this.spendableBalance);
    }
}

export class PrivateTokenBalance extends TokenBalance {
    readonly isUnlocked: boolean;

    /**
     * The pending balance of the token in ERC20 units
     */
    readonly pendingBalance: bigint;

    /**
     * The rate of the token in ERC20 units per Tongo unit
     */
    readonly rate: bigint;
    /**
     * The decrypted balance of the token in Tongo units
     */
    private readonly decryptedBalance: bigint;
    /**
     * The decrypted pending balance of the token in Tongo units
     */
    private readonly decryptedPendingBalance: bigint;

    readonly privateTokenAddress: PrivateTokenAddress | null;

    constructor(
        token: Token,
        rate: bigint,
        decryptedBalance: bigint,
        decryptedPendingBalance: bigint,
        isUnlocked: boolean,
        privateTokenAddress: PrivateTokenAddress | null
    ) {
        const balance = PrivateTokenBalance.convertToERC20Balance(decryptedBalance, rate, token.decimals);
        const pending = PrivateTokenBalance.convertToERC20Balance(decryptedPendingBalance, rate, token.decimals);

        super(token, balance + pending);

        this.rate = rate;
        this.decryptedBalance = decryptedBalance;
        this.decryptedPendingBalance = decryptedPendingBalance;
        this.isUnlocked = isUnlocked;
        this.privateTokenAddress = privateTokenAddress;

        this.pendingBalance = pending;
    }

    formattedBalance(compressed: boolean = false): string {
        if (!this.isUnlocked) {
            return "LOCKED";
        }

        return super.formattedBalance(compressed, this.spendableBalance);
    }

    formattedFiatPrice(): string | null {
        if (!this.isUnlocked) {
            return null;
        }

        return super.formattedFiatPrice();
    }

    get unlockedBalance(): bigint | null {
        return this.isUnlocked ? this.spendableBalance : null;
    }

    get unlockedPendingBalance(): bigint | null {
        return this.isUnlocked ? this.pendingBalance : null;
    }

    get minAcceptedBalance(): bigint {
        return PrivateTokenBalance.convertToERC20Balance(1n, this.rate, this.token.decimals);
    }

    get claimedBalance(): bigint {
        return this.spendableBalance - this.pendingBalance;
    }

    withUpdatedToken(token: Token): PrivateTokenBalance {
        return new PrivateTokenBalance(
            token,
            this.rate,
            this.decryptedBalance,
            this.decryptedPendingBalance,
            this.isUnlocked,
            this.privateTokenAddress
        );
    }

    private static convertToERC20Balance(decryptedBalance: bigint, rate: bigint, decimals: number): bigint {
        return decryptedBalance * rate;
    }

    static locked(token: Token): PrivateTokenBalance {
        return new PrivateTokenBalance(token, 0n, 0n, 0n, false, null);
    }

    static unlocked(token: Token, rate: bigint, state: TongoBalanceState, privateTokenAddress: PrivateTokenAddress): PrivateTokenBalance {
        return new PrivateTokenBalance(token, rate, state.balance, state.pending, true, privateTokenAddress);
    }
}