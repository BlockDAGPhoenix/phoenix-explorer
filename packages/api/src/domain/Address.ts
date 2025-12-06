/**
 * Address Domain Model
 */
export interface Address {
  address: string;
  balance: bigint;
  nonce: bigint;
  isContract: boolean;
  contractCode?: string;
  transactionCount: bigint;
  firstSeenAt?: bigint;
  lastSeenAt?: bigint;
}

