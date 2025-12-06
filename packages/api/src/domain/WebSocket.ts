/**
 * WebSocket Domain Models
 */
export type SubscriptionType = 'newBlocks' | 'newTransactions' | 'address';

export interface WebSocketMessage {
  method?: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'connected' | 'unsubscribed';
  params?: any[];
  subscription?: string;
  data?: any;
  clientId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface Subscription {
  id: string;
  type: SubscriptionType;
  address?: string; // For address subscriptions
  clientId: string;
  createdAt: Date;
}

export interface BlockUpdate {
  hash: string;
  number: bigint;
  timestamp: bigint;
  transactionCount: number;
}

export interface TransactionUpdate {
  hash: string;
  blockHash: string;
  blockNumber: bigint;
  from: string;
  to?: string;
  value: bigint;
}

export interface AddressUpdate {
  address: string;
  balance: bigint;
  transactionHash: string;
  blockNumber: bigint;
}

