import * as Crypto from 'expo-crypto';

export const hashSecret = async (value: string) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
};
