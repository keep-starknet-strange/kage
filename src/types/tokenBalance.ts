import Identifiable from "@/types/Identifiable";
import Token from "@/types/token";
import { AccountState as TongoBalanceState } from "@fatsolutions/tongo-sdk";
import { tokenAmountToFormatted } from "@/utils/formattedBalance";
import PrivateTokenAddress from "./privateRecipient";

export abstract class TokenBalance implements Identifiable {
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
}

export class PrivateTokenBalance extends TokenBalance {
    readonly isUnlocked: boolean;

    /**
     * The pending balance of the token in ERC20 units
     */
    private readonly pendingBalance: bigint;
    
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
        super(token, PrivateTokenBalance.convertToERC20Balance(decryptedBalance, rate, token.decimals));
        
        this.rate = rate;
        this.decryptedBalance = decryptedBalance;
        this.decryptedPendingBalance = decryptedPendingBalance;
        this.isUnlocked = isUnlocked;
        this.privateTokenAddress = privateTokenAddress;

        this.pendingBalance = PrivateTokenBalance.convertToERC20Balance(decryptedPendingBalance, rate, token.decimals);
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

    get minAcceptedBalance(): bigint {
        return PrivateTokenBalance.convertToERC20Balance(1n, this.rate, this.token.decimals);
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