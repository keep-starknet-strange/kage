import Token from "@/types/token";
import { LOG } from "./logs";

export function fiatBalanceToFormatted(
    balance: number,
    currency: string = 'USD',
): string {
    return new Intl.NumberFormat('default', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(balance);
}

// TODO: Current implementation loses precision when converting to float
// Better approach is to use Intl.NumberFormat.formatToParts but this currently seems to not be polyfilled for React Native
export function tokenAmountToFormatted(
    compressed: boolean = false, 
    balance: bigint, 
    token: Token,
): string {
    const divisor = BigInt(10) ** BigInt(token.decimals);
    const integerPart = (balance / divisor).toString();
    const fractionalPart = (balance % divisor).toString().padStart(token.decimals, '0');
    const maxFractionDigits = compressed ? Math.min(4, token.decimals) : token.decimals;

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
    return formattedUSDLike.replace('USD', token.symbol);
}

export function stringToBigint(value: string, decimals: number, separator: string = '.'): bigint {
    if (!value || value.trim() === '') {
        return 0n;
    }

    const trimmedValue = value.trim();
    const regex = new RegExp(`/^-?\\d*\\${separator}\\d+$/`);
    if (regex.test(trimmedValue)) {
        LOG.warn('stringToBigint: invalid value', trimmedValue);
        return 0n;
    }

    const isNegative = trimmedValue.startsWith('-');
    const absoluteValue = isNegative ? trimmedValue.slice(1) : trimmedValue;

    const [integerPart = '0', decimalPart = ''] = absoluteValue.split(separator);

    // Pad or truncate decimal part to match the required decimals
    let adjustedDecimalPart = decimalPart;
    
    if (decimalPart.length > decimals) {
        // Truncate if more decimals than allowed
        adjustedDecimalPart = decimalPart.slice(0, decimals);
    } else if (decimalPart.length < decimals) {
        // Pad with zeros if fewer decimals than required
        adjustedDecimalPart = decimalPart.padEnd(decimals, '0');
    }

    // Combine integer and decimal parts
    const combinedValue = integerPart + adjustedDecimalPart;

    // Convert to bigint
    const result = BigInt(combinedValue);

    return isNegative ? -result : result;
}