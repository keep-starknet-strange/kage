import { AccountAddress } from "@/profile/account";
import SeedPhraseWords from "@/types/seedPhraseWords";
import Token from "@/types/token";
import StarKMSProvider from "./StarKMSProvider";

export interface KMSProvider {
    deriveKeyPair(args: KeyDerivationArgs, seedPhrase: SeedPhraseWords): KeyPair;

    deriveAccountAddress(publicKey: string, classHash: string, salt: string): AccountAddress;

    generateMnemonic(): string[];

    validateMnemonic(mnemonic: string[], wordlist: string[]): boolean;
}

export type KeyDerivationArgs = {
    type: "account-key-pair";
    accountIndex: number;
} | {
    type: "token-key-pair";
    accountIndex: number;
    accountAddress: AccountAddress;
    token: Token;
} | {
    type: "get-id"
};


export type KeyPair = {
    privateKey: string;
    publicKey: string;
}

export const kmsProvider = new StarKMSProvider();