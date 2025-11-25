import { kmsProvider } from "@/crypto/kms/KMSProvider";
import { wordlist } from "@scure/bip39/wordlists/english";
import { AppError } from "./appError";

export const SEED_PHRASE_WORD_COUNT = 24;
export const SEED_PHRASE_WORDS_SEPARATOR = ' ';

export default class SeedPhraseWords {

    constructor(
        private readonly words: string[],
    ) {
        const isValid = kmsProvider.validateMnemonic(words, wordlist);
        if (!isValid) {
            throw new AppError('Invalid seed phrase');
        }

        this.words = words;
    }

    getWords(): string[] {
        return this.words;
    }

    toString(): string {
        return this.words.join(SEED_PHRASE_WORDS_SEPARATOR);
    }

    static fromMnemonic(mnemonic: string): SeedPhraseWords {
        const words = mnemonic.split(SEED_PHRASE_WORDS_SEPARATOR);
        if (words.length !== SEED_PHRASE_WORD_COUNT) {
            throw new AppError('Invalid seed phrase');
        }
        return new SeedPhraseWords(words);
    }

    static generate(): SeedPhraseWords {
        const mnemonic = kmsProvider.generateMnemonic();
        return new SeedPhraseWords(mnemonic);
    }
}