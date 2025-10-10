import { createSeededRng, randomPick } from './seed';

const WORD_POOL = [
  'shadow',
  'veil',
  'silent',
  'cipher',
  'obscure',
  'midnight',
  'ember',
  'horizon',
  'aurora',
  'nebula',
  'whisper',
  'shield',
  'cascade',
  'lumen',
  'onyx',
  'solace',
  'echo',
  'flux',
  'vault',
  'kage',
  'stark',
  'normal',
  'privacy',
  'cipher',
  'silent',
];

export const generateMnemonicPreview = (seed = 'KAGE-DEMO-MNEMONIC') => {
  const rng = createSeededRng(seed);
  const words: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    words.push(randomPick(rng, WORD_POOL));
  }
  return words;
};
