export type Currency = 'STRK' | 'BTC' | 'USDC';

export interface Balance {
  currency: Currency;
  publicAmount: number;
  shieldedAmount: number;
}

export type AssocSet = 'RECOMMENDED' | 'CUSTOM' | 'MINIMAL';

export type TxnType =
  | 'SEND'
  | 'RECEIVE'
  | 'SWAP'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'DISCLOSURE';

export interface Txn {
  id: string;
  type: TxnType;
  privacy: 'PUBLIC' | 'PRIVATE';
  currency: Currency;
  amount: number;
  toFrom: string;
  assocSet?: AssocSet;
  fee: number;
  timestamp: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  note?: string;
}

export interface ViewingKey {
  id: string;
  label: string;
  createdAt: number;
  revokedAt?: number;
  uri: string;
  lastAccessAt?: number;
}

export interface ShieldedOp {
  id: string;
  direction: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  denom: number;
  assocSet: AssocSet;
  fee: number;
  proof?: string;
  status: 'PREPARING' | 'PROVING' | 'POSTING' | 'COMPLETE' | 'FAILED';
  steps?: Array<{ label: string; status: 'PENDING' | 'ACTIVE' | 'DONE' }>; // for UI sequencing
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  viewingKeyId?: string;
  alias?: string;
  lastInteraction?: number;
}

export interface WalletState {
  id: string;
  mnemonicPreview: string[];
  balances: Balance[];
  activity: Txn[];
  contacts: Contact[];
  viewingKeys: ViewingKey[];
}

export interface ProofExport {
  id: string;
  type: 'CLEAN_FUNDS' | 'SHIELDED_WITHDRAWAL';
  payload: string;
  createdAt: number;
}

export interface AssociationPreset {
  id: AssocSet;
  title: string;
  description: string;
  feeModifier: number;
  etaSeconds: number;
}
