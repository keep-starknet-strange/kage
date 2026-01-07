import Amount, { PrivateAmount, PublicAmount } from "@/types/amount";
import { TokenContract } from "@/types/token";
import { PrivateTokenBalance, PublicTokenBalance, TokenBalance } from "@/types/tokenBalance";
import { stringToBigint, tokenAmountToFormatted } from "@/utils/formattedBalance";
import { SwapAmount, SwapTokenBalance } from "@/utils/swap";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TokenAmountInput } from "./token-amount-input";

type AmountType<T extends TokenContract, B extends TokenBalance<T>> =
    B extends PrivateTokenBalance ? PrivateAmount :
    B extends PublicTokenBalance ? PublicAmount :
    B extends SwapTokenBalance ? SwapAmount :
    Amount<T>;

type BalanceInputProps<T extends TokenContract, B extends TokenBalance<T>> = {
    label?: string;
    onAmountChange: (amount: AmountType<T, B> | null) => void;
    placeholder?: string;
    disabled?: boolean;
    balances: B[];
};

export function BalanceInput<T extends TokenContract, B extends TokenBalance<T>>({
    label,
    onAmountChange,
    placeholder,
    disabled = false,
    balances
}: BalanceInputProps<T, B>) {
    const { t } = useTranslation();
    const [selectedBalance, setSelectedBalance] = useState<B | null>(null);
    const [hintMessage, setHintMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [amountText, setAmountText] = useState<string>("");

    useEffect(() => {
        if (selectedBalance) {
            if (selectedBalance instanceof PrivateTokenBalance) {
                setHintMessage(`Private Balance: ${selectedBalance.formattedBalance()}`);
            } else {
                setHintMessage(`Balance: ${selectedBalance.formattedBalance()}`);
            }
        }
    }, [selectedBalance, setHintMessage]);

    useEffect(() => {
        if (!selectedBalance) {
            setAmountText("");
            setError(null);
            return;
        }

        if (amountText.trim() === '') {
            onAmountChange(null);
            setError(null);
            return;
        }

        let amountDecimal: bigint | null = null;
        if (!isNaN(Number(amountText))) {
            amountDecimal = stringToBigint(amountText, selectedBalance.token.decimals, '.');
        }

        if (amountDecimal === null) {
            onAmountChange(null);
            setError(null);
            return;
        }

        const minRange = selectedBalance instanceof PrivateTokenBalance ? selectedBalance.minAcceptedBalance : 0n;
        const maxRange = selectedBalance.spendableBalance;

        if (amountDecimal > maxRange) {
            setError(t('forms.amount.exceedsBalance'))
            onAmountChange(null);
            return;
        } else if (selectedBalance instanceof PrivateTokenBalance && amountDecimal < minRange) {
            setError(t('forms.amount.minPrivateAmount', {
                symbol: selectedBalance.token.symbol,
                minAmount: tokenAmountToFormatted(false, minRange, selectedBalance.token)
            }))
            onAmountChange(null);
            return;
        } else if (amountDecimal < minRange) {
            setError(t('forms.amount.negativeNotAllowed'))
            onAmountChange(null);
            return;
        }

        setError(null);

        if (selectedBalance instanceof PublicTokenBalance) {
            const amount = PublicAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount as AmountType<T, B>);
        } else if (selectedBalance instanceof PrivateTokenBalance) {
            const amount = PrivateAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount as AmountType<T, B>);
        } else if (selectedBalance instanceof SwapTokenBalance) {
            const amount = new SwapAmount(amountDecimal, selectedBalance.token);
            onAmountChange(amount as AmountType<T, B>);
        }
    }, [amountText, selectedBalance, setError, onAmountChange, t]);

    // Handle token updates
    const handleTokenChange = useCallback((token: T | null) => {
        if (!token) {
            setSelectedBalance(null);
            return;
        }

        const balance = balances.find(balance => balance.token.contractAddress === token.contractAddress) ?? null;
        setSelectedBalance(balance);
    }, [setSelectedBalance, balances]);

    return <TokenAmountInput
        label={label}
        amount={amountText}
        setAmount={setAmountText}
        selectedToken={selectedBalance?.token ?? null}
        setSelectedToken={handleTokenChange}
        placeholder={placeholder}
        disabled={disabled}
        hintText={hintMessage ?? undefined}
        errorText={error ?? undefined}
        tokens={balances.map(balance => balance.token)}
    />;
}
