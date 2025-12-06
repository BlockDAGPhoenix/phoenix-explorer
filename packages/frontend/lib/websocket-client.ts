import { BlockUpdate, TransactionUpdate, AddressUpdate } from '@/types/websocket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6662/ws';

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

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(type: SubscriptionType, address?: string, callback?: (data: any) => void): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
      // Wait for connection
      setTimeout(() => this.subscribe(type, address, callback), 500);
      return;
    }

    const params = address ? [type, address] : [type];
    this.ws.send(JSON.stringify({
      method: 'subscribe',
      params,
    }));

    if (callback) {
      this.addListener(type, callback);
    }
  }

  unsubscribe(subscriptionId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      method: 'unsubscribe',
      params: [subscriptionId],
    }));
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.error) {
      console.error('WebSocket error:', message.error);
      return;
    }

    if (message.subscription) {
      const listeners = this.listeners.get(message.subscription);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(message.data);
          } catch (error) {
            console.error('Error in WebSocket listener:', error);
          }
        });
      }
    }
  }

  private addListener(type: SubscriptionType, callback: (data: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  removeListener(type: SubscriptionType, callback: (data: any) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

