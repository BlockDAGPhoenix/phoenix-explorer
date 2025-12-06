export interface BlockUpdate {
  hash: string;
  number: string;
  timestamp: string;
  transactionCount: number;
}

export interface TransactionUpdate {
  hash: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to?: string;
  value: string;
}

export interface AddressUpdate {
  address: string;
  balance: string;
  transactionHash: string;
  blockNumber: string;
}

