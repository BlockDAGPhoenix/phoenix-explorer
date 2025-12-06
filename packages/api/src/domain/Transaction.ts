/**
 * Transaction Domain Model
 */
export interface Transaction {
  hash: string;
  blockHash: string;
  blockNumber: bigint;
  transactionIndex: number;
  from: string;
  to?: string;
  value: bigint;
  gasLimit: bigint;
  gasPrice?: bigint;
  gasUsed?: bigint;
  nonce: bigint;
  input: string;
  status?: number;
  createsContract: boolean;
  contractAddress?: string;
  timestamp?: bigint;
}

