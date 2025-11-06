import { joinMnemonicWords, mnemonicToWords } from "@starkms/key-management";

export default class SeedPhraseWords {

    constructor(
        private readonly words: string[],
    ) {
        // TODO Add length validation
        // TODO Add wordlist validation
    }

    getWords(): string[] {
        return this.words;
    }

    toString(): string {
        return joinMnemonicWords(this.words);
    }

    static fromMnemonic(mnemonic: string): SeedPhraseWords {
        return new SeedPhraseWords(mnemonicToWords(mnemonic));
    }
}