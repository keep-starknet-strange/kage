function toSafeBigint(amount: number): bigint {
    const [integerPart] = amount.toString().split(".");

    // 4. Convert the final integer string to BigInt
    return BigInt(integerPart);
}

export default toSafeBigint;