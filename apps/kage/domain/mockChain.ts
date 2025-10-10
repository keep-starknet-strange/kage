import { faker } from '@faker-js/faker';

import { createSeededRng, randomFloat, randomInt, randomPick, seededId } from '../utils/seed';
import {
  AssocSet,
  Balance,
  Contact,
  ShieldedOp,
  Txn,
  ViewingKey,
} from './models';

const SEED = 'KAGE-DEMO-0001';
const rng = createSeededRng(SEED);

faker.seed(420042);

const currencies: Balance['currency'][] = ['BTC', 'USDC'];

const assocSets: AssocSet[] = ['RECOMMENDED', 'CUSTOM', 'MINIMAL'];

const associationCopy: Record<AssocSet, string> = {
  RECOMMENDED: 'Clean counterparties prioritized',
  CUSTOM: 'Manual allow list applied',
  MINIMAL: 'Fastest exit, higher scrutiny',
};

const balances: Balance[] = currencies.map((currency) => ({
  currency,
  publicAmount: randomFloat(rng, 0.4, 4.8, 3),
  shieldedAmount: randomFloat(rng, 2.4, 12.4, 3),
}));

const contacts: Contact[] = Array.from({ length: 5 }).map(() => ({
  id: seededId(rng, 'contact'),
  name: faker.person.firstName(),
  address: faker.finance.ethereumAddress(),
  alias: faker.word.words({ count: { min: 1, max: 2 } }),
  lastInteraction: Date.now() - randomInt(rng, 2, 72) * 3_600_000,
}));

const now = Date.now();

const activity: Txn[] = Array.from({ length: 12 }).map(() => {
  const currency = randomPick(rng, currencies);
  const privacy = rng() > 0.35 ? 'PRIVATE' : 'PUBLIC';
  const type = randomPick(rng, ['SEND', 'RECEIVE', 'SWAP', 'DEPOSIT', 'WITHDRAW', 'DISCLOSURE'] as Txn['type'][]);
  const amount = randomFloat(rng, 0.02, 4.2, 4);
  const timestamp = now - randomInt(rng, 1, 168) * 3_600_000;
  return {
    id: seededId(rng, 'txn'),
    type,
    privacy,
    currency,
    amount,
    toFrom: faker.finance.ethereumAddress(),
    assocSet: privacy === 'PRIVATE' ? randomPick(rng, assocSets) : undefined,
    fee: randomFloat(rng, 0.0001, 0.001, 5),
    timestamp,
    status: rng() > 0.1 ? 'CONFIRMED' : 'PENDING',
    note: privacy === 'PRIVATE' ? associationCopy[randomPick(rng, assocSets)] : undefined,
  };
});

const viewingKeys: ViewingKey[] = Array.from({ length: 3 }).map(() => ({
  id: seededId(rng, 'vk'),
  label: faker.company.name(),
  createdAt: now - randomInt(rng, 5, 40) * 24 * 3_600_000,
  lastAccessAt: now - randomInt(rng, 2, 12) * 3_600_000,
  uri: `kagevk://${faker.string.alphanumeric(42)}`,
}));

export const mockChain = {
  getBalances(): Balance[] {
    return balances.map((balance) => ({ ...balance }));
  },
  listActivity(): Txn[] {
    return activity.slice().sort((a, b) => b.timestamp - a.timestamp);
  },
  listContacts(): Contact[] {
    return contacts.slice();
  },
  listViewingKeys(): ViewingKey[] {
    return viewingKeys.slice();
  },
  issueViewingKey({ label }: { label: string }): ViewingKey {
    const key: ViewingKey = {
      id: seededId(rng, 'vk'),
      label,
      createdAt: Date.now(),
      uri: `kagevk://${faker.string.alphanumeric(48)}`,
      lastAccessAt: Date.now(),
    };
    viewingKeys.push(key);
    return key;
  },
  revokeViewingKey(id: string): ViewingKey | undefined {
    const key = viewingKeys.find((vk) => vk.id === id);
    if (key) {
      key.revokedAt = Date.now();
    }
    return key;
  },
  async send({
    to,
    amount,
    currency,
    privacy,
    assocSet,
  }: {
    to: string;
    amount: number;
    currency: Balance['currency'];
    privacy: 'PUBLIC' | 'PRIVATE';
    assocSet?: AssocSet;
  }): Promise<Txn> {
    await timeout(randomInt(rng, 600, 900));
    const txn: Txn = {
      id: seededId(rng, 'txn'),
      type: 'SEND',
      privacy,
      currency,
      amount,
      toFrom: to,
      assocSet,
      fee: randomFloat(rng, 0.0001, 0.002, 5),
      timestamp: Date.now(),
      status: 'CONFIRMED',
    };
    activity.unshift(txn);
    adjustBalance(currency, -amount, privacy === 'PRIVATE');
    return txn;
  },
  async depositShielded({ amount, denom }: { amount: number; denom: number }): Promise<ShieldedOp> {
    await timeout(randomInt(rng, 400, 600));
    const op: ShieldedOp = {
      id: seededId(rng, 'shield'),
      direction: 'DEPOSIT',
      amount,
      denom,
      assocSet: 'RECOMMENDED',
      fee: randomFloat(rng, 0.0001, 0.001, 5),
      status: 'COMPLETE',
    };
    adjustBalance('USDC', amount, true);
    activity.unshift({
      id: seededId(rng, 'txn'),
      type: 'DEPOSIT',
      privacy: 'PRIVATE',
      currency: 'USDC',
      amount,
      toFrom: 'Shielded Pool',
      assocSet: 'RECOMMENDED',
      fee: op.fee,
      timestamp: Date.now(),
      status: 'CONFIRMED',
    });
    return op;
  },
  async withdrawShielded({ amount, assocSet }: { amount: number; assocSet: AssocSet }): Promise<{ proof: string }> {
    await timeout(randomInt(rng, 2000, 2600));
    adjustBalance('USDC', -amount, true);
    const proof = `proof-${faker.string.alphanumeric(64)}`;
    activity.unshift({
      id: seededId(rng, 'txn'),
      type: 'WITHDRAW',
      privacy: 'PRIVATE',
      currency: 'USDC',
      amount,
      toFrom: 'External Account',
      assocSet,
      fee: randomFloat(rng, 0.0001, 0.001, 5),
      timestamp: Date.now(),
      status: 'CONFIRMED',
      note: associationCopy[assocSet],
    });
    return { proof };
  },
};

type BalanceCurrency = Balance['currency'];

const adjustBalance = (currency: BalanceCurrency, delta: number, shielded: boolean) => {
  const balance = balances.find((item) => item.currency === currency);
  if (!balance) return;
  if (shielded) {
    balance.shieldedAmount = Math.max(0, balance.shieldedAmount + delta);
  } else {
    balance.publicAmount = Math.max(0, balance.publicAmount + delta);
  }
};

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
