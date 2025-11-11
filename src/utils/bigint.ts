export function toSafeBigint(amount: number): bigint {
    const [integerPart] = amount.toString().split(".");

    // 4. Convert the final integer string to BigInt
    return BigInt(integerPart);
}

export function min(a: bigint, b: bigint): bigint {
    return a < b ? a : b;
}

export function max(a: bigint, b: bigint): bigint {
    return a > b ? a : b;
}