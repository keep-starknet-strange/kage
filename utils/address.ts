import { createSeededRng } from './seed';

const HEX = 'abcdef0123456789';

export const generateAddressList = (count = 10, seed = 'KAGE-ADDRESS-SEED') => {
  const rng = createSeededRng(seed);
  const addresses: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let address = '0x';
    for (let j = 0; j < 40; j += 1) {
      const index = Math.floor(rng() * HEX.length);
      address += HEX[index];
    }
    addresses.push(address);
  }
  return addresses;
};
