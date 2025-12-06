import { WebSocket } from 'ws';
import { IWebSocketService } from '../interfaces/services/IWebSocketService';
import {
  Subscription,
  SubscriptionType,
  BlockUpdate,
  TransactionUpdate,
  AddressUpdate,
  WebSocketMessage,
} from '../domain/WebSocket';

/**
 * WebSocket Service Implementation
 * Follows ISP: Only implements IWebSocketService (connection and subscription management)
 */
export class WebSocketService implements IWebSocketService {
  private clients: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private clientSubscriptions: Map<string, Set<string>> = new Map();

  handleConnection(clientId: string, ws: WebSocket): void {
    this.clients.set(clientId, ws);
    this.clientSubscriptions.set(clientId, new Set());

    // Send connection confirmation
    this.sendMessage(ws, {
      method: 'connected',
      data: { clientId },
    });

    // Set up message handler
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(clientId, message);
      } catch (error) {
        this.sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
      }
    });

    // Set up close handler
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Set up error handler
    ws.on('error', () => {
      this.handleDisconnection(clientId);
    });
  }

  handleDisconnection(clientId: string): void {
    // Remove all subscriptions for this client
    const subscriptionIds = this.clientSubscriptions.get(clientId);
    if (subscriptionIds) {
      subscriptionIds.forEach((subscriptionId) => {
        this.subscriptions.delete(subscriptionId);
      });
      this.clientSubscriptions.delete(clientId);
    }

    // Remove client
    this.clients.delete(clientId);
  }

  handleMessage(clientId: string, message: WebSocketMessage): void {
    if (!this.clients.has(clientId)) {
      return;
    }

    const ws = this.clients.get(clientId)!;

    switch (message.method) {
      case 'subscribe':
        if (message.params && message.params.length > 0) {
          const type = message.params[0] as SubscriptionType;
          const address = message.params[1] as string | undefined;
          const subscriptionId = this.subscribe(clientId, type, address);
          this.sendMessage(ws, {
            subscription: subscriptionId,
            data: { type, address },
          });
        } else {
          this.sendError(ws, 'INVALID_PARAMS', 'Subscription type required');
        }
        break;

      case 'unsubscribe':
        if (message.params && message.params.length > 0) {
          const subscriptionId = message.params[0] as string;
          const success = this.unsubscribe(clientId, subscriptionId);
          this.sendMessage(ws, {
            method: 'unsubscribed',
            data: { subscriptionId, success },
          });
        } else {
          this.sendError(ws, 'INVALID_PARAMS', 'Subscription ID required');
        }
        break;

      case 'ping':
        this.sendMessage(ws, { method: 'pong' });
        break;

      default:
        this.sendError(ws, 'UNKNOWN_METHOD', `Unknown method: ${message.method}`);
    }
  }

  subscribe(clientId: string, type: SubscriptionType, address?: string): string {
    if (!this.clients.has(clientId)) {
      throw new Error('Client not connected');
    }

    // Validate subscription type
    const validTypes: SubscriptionType[] = ['newBlocks', 'newTransactions', 'address'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid subscription type: ${type}`);
    }

    // Validate address for address subscriptions
    if (type === 'address' && !address) {
      throw new Error('Address required for address subscription');
    }

    if (type === 'address' && address && !this.isValidAddress(address)) {
      throw new Error('Invalid address format');
    }

    const subscriptionId = `${clientId}-${type}-${Date.now()}-${Math.random()}`;
    const subscription: Subscription = {
      id: subscriptionId,
      type,
      address,
      clientId,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    const clientSubs = this.clientSubscriptions.get(clientId);
    if (clientSubs) {
      clientSubs.add(subscriptionId);
    }

    return subscriptionId;
  }

  unsubscribe(clientId: string, subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription || subscription.clientId !== clientId) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);

    const clientSubs = this.clientSubscriptions.get(clientId);
    if (clientSubs) {
      clientSubs.delete(subscriptionId);
    }

    return true;
  }

  broadcastBlockUpdate(update: BlockUpdate): void {
    const message: WebSocketMessage = {
      subscription: 'newBlocks',
      data: {
        hash: update.hash,
        number: update.number.toString(),
        timestamp: update.timestamp.toString(),
        transactionCount: update.transactionCount,
      },
    };

    this.broadcastToSubscribers('newBlocks', message);
  }

  broadcastTransactionUpdate(update: TransactionUpdate): void {
    const message: WebSocketMessage = {
      subscription: 'newTransactions',
      data: {
        hash: update.hash,
        blockHash: update.blockHash,
        blockNumber: update.blockNumber.toString(),
        from: update.from,
        to: update.to,
        value: update.value.toString(),
      },
    };

    this.broadcastToSubscribers('newTransactions', message);
  }

  broadcastAddressUpdate(update: AddressUpdate): void {
    const message: WebSocketMessage = {
      subscription: 'address',
      data: {
        address: update.address,
        balance: update.balance.toString(),
        transactionHash: update.transactionHash,
        blockNumber: update.blockNumber.toString(),
      },
    };

    // Only send to subscribers for this specific address
    this.subscriptions.forEach((subscription) => {
      if (
        subscription.type === 'address' &&
        subscription.address?.toLowerCase() === update.address.toLowerCase()
      ) {
        const ws = this.clients.get(subscription.clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, message);
        }
      }
    });
  }

  private broadcastToSubscribers(type: SubscriptionType, message: WebSocketMessage): void {
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === type) {
        const ws = this.clients.get(subscription.clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, message);
        }
      }
    });
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      // Client disconnected, ignore
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.sendMessage(ws, {
      error: { code, message },
    });
  }

  private isValidAddress(address: string): boolean {
    const addressRegex = /^0x[0-9a-fA-F]{40}$/;
    return addressRegex.test(address);
  }
}

