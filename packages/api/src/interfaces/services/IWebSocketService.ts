import { SubscriptionType, BlockUpdate, TransactionUpdate, AddressUpdate } from '../../domain/WebSocket';

/**
 * WebSocket Service Interface (ISP: Connection and subscription management)
 */
export interface IWebSocketService {
  handleConnection(clientId: string, ws: any): void;
  handleDisconnection(clientId: string): void;
  handleMessage(clientId: string, message: any): void;
  subscribe(clientId: string, type: SubscriptionType, address?: string): string;
  unsubscribe(clientId: string, subscriptionId: string): boolean;
  broadcastBlockUpdate(update: BlockUpdate): void;
  broadcastTransactionUpdate(update: TransactionUpdate): void;
  broadcastAddressUpdate(update: AddressUpdate): void;
}

