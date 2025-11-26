import 'react-native-get-random-values';

// Needed for get-id functionality to work.
import "@ethersproject/shims";
import "reflect-metadata";

// Install react-native-quick-crypto - provides native crypto implementations
// This sets global.crypto with native OpenSSL-backed operations
import QuickCrypto, { install } from 'react-native-quick-crypto';
install();

const { pbkdf2Sync } = QuickCrypto;

// Register native PBKDF2 with ethers for fast key derivation
// This replaces the default JS implementation (~2000ms) with native (~10-50ms)
import { pbkdf2 } from 'ethers';

pbkdf2.register((password: Uint8Array, salt: Uint8Array, iterations: number, keylen: number, algo: string): Uint8Array => {
  const result = pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(salt),
    iterations,
    keylen,
    algo
  );
  return new Uint8Array(result);
});
