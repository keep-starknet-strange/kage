import { AccountAddress } from "@/profile/account";
import { CoinType } from "@/profile/keys/coinType";
import { LOG } from "@/utils/logs";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { deriveAccountAddress, deriveStarknetKeyPairs, generateMnemonicWords, getStarknetPublicKeyFromPrivate, grindKey, joinMnemonicWords, pathHash, StarknetKeyConst, validateMnemonic } from "@starkms/key-management";
import { ethers } from "ethers";
import { encode } from "starknet";
import { KeyDerivationArgs, KeyPair, KMSProvider } from "./KMSProvider";

export default class StarKMSProvider implements KMSProvider {
    deriveKeyPair(args: KeyDerivationArgs, seedPhrase: SeedPhraseWords): KeyPair {
        const startTime = Date.now();

        switch (args.type) {
            case "account-key-pair":
                const accountKeyPairs = deriveStarknetKeyPairs(
                    {
                        accountIndex: 0,
                        addressIndex: args.accountIndex,
                    },
                    seedPhrase.toString(),
                    true
                );

                LOG.info(`[KMS] deriveKeyPair(account-key-pair) completed in ${Date.now() - startTime}ms`);
                return {
                    privateKey: accountKeyPairs.spendingKeyPair.privateSpendingKey,
                    publicKey: accountKeyPairs.spendingKeyPair.publicSpendingKey,
                };
            case "token-key-pair":
                const tokenIndex = pathHash(`${args.accountAddress}.${args.token.contractAddress}.${args.token.tongoAddress}`);
                const tokenKeyPairs = deriveStarknetKeyPairs(
                    {
                        accountIndex: args.accountIndex,
                        addressIndex: tokenIndex,
                    },
                    seedPhrase.toString(),
                    true
                );
                LOG.info(`[KMS] deriveKeyPair(token-key-pair) completed in ${Date.now() - startTime}ms`);
                return {
                    privateKey: tokenKeyPairs.spendingKeyPair.privateSpendingKey,
                    publicKey: tokenKeyPairs.spendingKeyPair.publicSpendingKey,
                };
            case "get-id":
                const { addHexPrefix } = encode;

                const getIdPath = `m/${StarknetKeyConst.PURPOSE}'/${CoinType.STARKNET}'/365'`
                const mnemonic = seedPhrase.toString();

                const hdWalletStart = Date.now();
                const derivedNode = ethers.HDNodeWallet.fromPhrase(
                    mnemonic,
                    undefined,
                    getIdPath,
                )
                LOG.info(`[KMS] HDNodeWallet.fromPhrase completed in ${Date.now() - hdWalletStart}ms`);

                const privateKeyHex = addHexPrefix(grindKey(derivedNode.privateKey));
                const pubKey = getStarknetPublicKeyFromPrivate(privateKeyHex, true);
                LOG.info(`[KMS] deriveKeyPair(get-id) completed in ${Date.now() - startTime}ms`);
                return {
                    privateKey: privateKeyHex,
                    publicKey: pubKey,
                };
        }
    }

    deriveAccountAddress(publicKey: string, classHash: string, salt: string): AccountAddress {
        const accountAddress = deriveAccountAddress(
            publicKey,
            { classHash: classHash, salt: salt }
        ).address;

        return AccountAddress.fromHex(accountAddress);
    }

    generateMnemonic(): string[] {
        return generateMnemonicWords();
    }

    validateMnemonic(mnemonic: string[], wordlist: string[]): boolean {
        return validateMnemonic(joinMnemonicWords(mnemonic), wordlist);
    }
}