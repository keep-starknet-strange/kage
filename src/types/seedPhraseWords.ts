import { wordlist } from "@scure/bip39/wordlists/english";
import { joinMnemonicWords, mnemonicToWords, validateMnemonic } from "@starkms/key-management";
import { AppError } from "./appError";

export const SEED_PHRASE_WORD_COUNT = 24;

export default class SeedPhraseWords {

    constructor(
        private readonly words: string[],
    ) {
        const mnemonic = words.join(' ');
        const isValid = validateMnemonic(mnemonic, wordlist);
        if (!isValid) {
            throw new AppError('Invalid seed phrase');
        }

        this.words = words;
    }

    getWords(): string[] {
        return this.words;
    }

    toString(): string {
        return joinMnemonicWords(this.words);
    }

    static fromMnemonic(mnemonic: string): SeedPhraseWords {
        const words = mnemonicToWords(mnemonic);
        if (words.length !== SEED_PHRASE_WORD_COUNT) {
            throw new AppError('Invalid seed phrase');
        }
        return new SeedPhraseWords(words);
    }
}