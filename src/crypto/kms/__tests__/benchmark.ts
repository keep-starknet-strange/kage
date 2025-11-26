/**
 * Benchmark utility for KMS key derivation performance testing.
 *
 * This can be called from within the app to measure key derivation performance.
 * Run in development mode to see timing results in the console.
 *
 * Usage:
 *   import { runKeyDerivationBenchmark } from '@/crypto/kms/__tests__/benchmark';
 *   runKeyDerivationBenchmark();
 */

import { LOG } from "@/utils/logs";
import { kmsProvider } from "../KMSProvider";
import SeedPhraseWords from "@/types/seedPhraseWords";

// Test mnemonic (24 words) - DO NOT use in production, this is only for benchmarking
const TEST_MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

interface BenchmarkResult {
    operation: string;
    iterations: number;
    totalMs: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
}

function formatResult(result: BenchmarkResult): string {
    return `${result.operation}:
    Iterations: ${result.iterations}
    Total: ${result.totalMs.toFixed(2)}ms
    Avg: ${result.avgMs.toFixed(2)}ms
    Min: ${result.minMs.toFixed(2)}ms
    Max: ${result.maxMs.toFixed(2)}ms`;
}

/**
 * Benchmark a specific key derivation operation
 */
function benchmarkOperation(
    name: string,
    operation: () => void,
    iterations: number = 5
): BenchmarkResult {
    const times: number[] = [];

    // Warm-up run (not counted)
    operation();

    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        operation();
        const elapsed = Date.now() - start;
        times.push(elapsed);
    }

    const totalMs = times.reduce((a, b) => a + b, 0);
    return {
        operation: name,
        iterations,
        totalMs,
        avgMs: totalMs / iterations,
        minMs: Math.min(...times),
        maxMs: Math.max(...times),
    };
}

/**
 * Run the full key derivation benchmark suite
 */
export function runKeyDerivationBenchmark(iterations: number = 5): BenchmarkResult[] {
    LOG.info("=== Starting KMS Key Derivation Benchmark ===");

    const seedPhrase = SeedPhraseWords.fromMnemonic(TEST_MNEMONIC);
    const results: BenchmarkResult[] = [];

    // Benchmark: get-id (uses HDNodeWallet.fromPhrase with PBKDF2)
    LOG.info("\nBenchmarking: get-id derivation...");
    const getIdResult = benchmarkOperation(
        "get-id",
        () => {
            kmsProvider.deriveKeyPair({ type: "get-id" }, seedPhrase);
        },
        iterations
    );
    results.push(getIdResult);
    LOG.info(formatResult(getIdResult));

    // Benchmark: account-key-pair
    LOG.info("\nBenchmarking: account-key-pair derivation...");
    const accountKeyResult = benchmarkOperation(
        "account-key-pair",
        () => {
            kmsProvider.deriveKeyPair({ type: "account-key-pair", accountIndex: 0 }, seedPhrase);
        },
        iterations
    );
    results.push(accountKeyResult);
    LOG.info(formatResult(accountKeyResult));

    // Summary
    LOG.info("\n=== Benchmark Summary ===");
    for (const result of results) {
        LOG.info(`${result.operation}: avg ${result.avgMs.toFixed(2)}ms (min: ${result.minMs.toFixed(2)}ms, max: ${result.maxMs.toFixed(2)}ms)`);
    }

    // Performance check
    const getIdAvg = getIdResult.avgMs;
    if (getIdAvg > 500) {
        LOG.warn(`⚠️ get-id derivation is slow (${getIdAvg.toFixed(0)}ms). Expected <100ms with native PBKDF2.`);
    } else if (getIdAvg > 100) {
        LOG.info(`⚡ get-id derivation is moderate (${getIdAvg.toFixed(0)}ms). Could be improved.`);
    } else {
        LOG.info(`✅ get-id derivation is fast (${getIdAvg.toFixed(0)}ms). Native PBKDF2 is working!`);
    }

    LOG.info("=== Benchmark Complete ===\n");

    return results;
}

/**
 * Quick single-run benchmark for debugging
 */
export function quickBenchmark(): { getIdMs: number; accountKeyMs: number } {
    const seedPhrase = SeedPhraseWords.fromMnemonic(TEST_MNEMONIC);

    const getIdStart = Date.now();
    kmsProvider.deriveKeyPair({ type: "get-id" }, seedPhrase);
    const getIdMs = Date.now() - getIdStart;

    const accountKeyStart = Date.now();
    kmsProvider.deriveKeyPair({ type: "account-key-pair", accountIndex: 0 }, seedPhrase);
    const accountKeyMs = Date.now() - accountKeyStart;

    LOG.info(`Quick benchmark: get-id=${getIdMs}ms, account-key-pair=${accountKeyMs}ms`);

    return { getIdMs, accountKeyMs };
}
