import seedrandom from 'seedrandom';

type RNG = seedrandom.PRNG;

export const createSeededRng = (seed: string): RNG => seedrandom(seed, { entropy: false });

export const randomInt = (rng: RNG, min: number, max: number) => {
  return Math.floor(rng() * (max - min + 1)) + min;
};

export const randomFloat = (rng: RNG, min: number, max: number, precision = 2) => {
  const value = rng() * (max - min) + min;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const randomPick = <T>(rng: RNG, items: readonly T[]): T => {
  const index = Math.floor(rng() * items.length);
  return items[index];
};

export const seededId = (rng: RNG, prefix: string) => `${prefix}-${Math.floor(rng() * 1_000_000)}`;
