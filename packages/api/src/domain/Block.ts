/**
 * Block Domain Model
 */
export interface Block {
  hash: string;
  number: bigint;
  parentHashes: string[];
  timestamp: bigint;
  miner: string;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas?: bigint;
  blueScore: bigint;
  isChainBlock: boolean;
  selectedParent?: string;
  transactionsRoot?: string;
  stateRoot?: string;
  receiptsRoot?: string;
  transactionCount: number;
}

export interface GHOSTDAGData {
  blockHash: string;
  blueScore: bigint;
  blueWork: bigint;
  selectedParent?: string;
  mergeSetBlues: string[];
  mergeSetReds: string[];
}

