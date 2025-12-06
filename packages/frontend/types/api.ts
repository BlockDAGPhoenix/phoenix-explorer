export interface Block {
  hash: string;
  number: bigint | string;
  timestamp: bigint | string;
  gasLimit: bigint | string;
  gasUsed: bigint | string;
  transactionCount: number;
  parentHashes: string[];
  blueScore: bigint | string;
}

export interface Transaction {
  hash: string;
  blockHash: string;
  blockNumber: bigint | string;
  transactionIndex: number;
  from: string;
  to?: string;
  value: bigint | string;
  gasLimit: bigint | string;
  gasPrice?: bigint | string;
  gasUsed?: bigint | string;
  nonce: bigint | string;
  input: string;
  status?: number;
  createsContract: boolean;
  contractAddress?: string;
  timestamp?: bigint | string;
}

export interface Address {
  address: string;
  balance: bigint | string;
  nonce: bigint | string;
  isContract: boolean;
  contractCode?: string;
  transactionCount: bigint | string;
  firstSeenAt?: bigint | string;
  lastSeenAt?: bigint | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

