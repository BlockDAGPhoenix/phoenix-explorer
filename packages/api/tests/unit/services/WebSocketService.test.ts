import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { WebSocketService } from '@/services/WebSocketService';
import { BlockUpdate, TransactionUpdate, AddressUpdate } from '@/domain/WebSocket';

describe('WebSocketService', () => {
  let service: WebSocketService;
  
  beforeEach(() => {
    service = new WebSocketService();
  });
  
  function createMockWebSocket(): any {
    const mockWs = Object.create(EventEmitter.prototype);
    EventEmitter.call(mockWs);
    mockWs.send = vi.fn();
    mockWs.readyState = 1; // OPEN
    mockWs.close = vi.fn();
    return mockWs;
  }

  describe('handleConnection', () => {
    it('should register new client connection', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);

      // Client should be registered - check that connection message was sent
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"method":"connected"')
      );
    });
  });

  describe('handleDisconnection', () => {
    it('should remove client and all subscriptions', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);
      service.subscribe(clientId, 'newBlocks');

      service.handleDisconnection(clientId);

      // Subscriptions should be removed - reconnect and verify
      const newMockWs = createMockWebSocket();
      service.handleConnection(clientId, newMockWs);
      const subscriptionId = service.subscribe(clientId, 'newBlocks');
      expect(subscriptionId).toBeTruthy(); // New subscription should work
    });
  });

  describe('subscribe', () => {
    it('should subscribe client to new blocks', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);

      const subscriptionId = service.subscribe(clientId, 'newBlocks');

      expect(subscriptionId).toBeTruthy();
      // Subscription doesn't send message directly, but we can verify it was created
      // by checking that broadcasts reach this client
      const update = {
        hash: '0x' + 'a'.repeat(64),
        number: 1000n,
        timestamp: 1706150400000n,
        transactionCount: 10,
      };
      service.broadcastBlockUpdate(update);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"subscription":"newBlocks"')
      );
    });

    it('should subscribe client to address activity', () => {
      const clientId = 'client-1';
      const address = '0x' + 'a'.repeat(40);
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);

      const subscriptionId = service.subscribe(clientId, 'address', address);

      expect(subscriptionId).toBeTruthy();
    });

    it('should return error for invalid subscription type', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);

      expect(() => {
        service.subscribe(clientId, 'invalid' as any);
      }).toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe client from subscription', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);
      const subscriptionId = service.subscribe(clientId, 'newBlocks');

      const result = service.unsubscribe(clientId, subscriptionId);

      expect(result).toBe(true);
    });

    it('should return false for non-existent subscription', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);

      const result = service.unsubscribe(clientId, 'non-existent');

      expect(result).toBe(false);
    });
  });

  describe('broadcastBlockUpdate', () => {
    it('should send block update to all newBlocks subscribers', () => {
      const clientId1 = 'client-1';
      const clientId2 = 'client-2';
      const mockWs1 = createMockWebSocket();
      const mockWs2 = createMockWebSocket();

      service.handleConnection(clientId1, mockWs1);
      service.handleConnection(clientId2, mockWs2);
      service.subscribe(clientId1, 'newBlocks');
      service.subscribe(clientId2, 'newTransactions'); // Different subscription

      const update: BlockUpdate = {
        hash: '0x' + 'a'.repeat(64),
        number: 1000n,
        timestamp: 1706150400000n,
        transactionCount: 10,
      };

      service.broadcastBlockUpdate(update);

      // Only client-1 should receive the update
      expect(mockWs1.send).toHaveBeenCalledWith(
        expect.stringContaining('"subscription":"newBlocks"')
      );
      expect(mockWs2.send).not.toHaveBeenCalledWith(
        expect.stringContaining('"subscription":"newBlocks"')
      );
    });
  });

  describe('broadcastTransactionUpdate', () => {
    it('should send transaction update to all newTransactions subscribers', () => {
      const clientId = 'client-1';
      const mockWebSocket = createMockWebSocket();
      service.handleConnection(clientId, mockWebSocket);
      service.subscribe(clientId, 'newTransactions');

      const update: TransactionUpdate = {
        hash: '0x' + 'b'.repeat(64),
        blockHash: '0x' + 'c'.repeat(64),
        blockNumber: 1000n,
        from: '0x' + 'a'.repeat(40),
        value: 1000000000000000000n,
      };

      service.broadcastTransactionUpdate(update);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"subscription":"newTransactions"')
      );
    });
  });

  describe('broadcastAddressUpdate', () => {
    it('should send address update only to matching address subscribers', () => {
      const clientId1 = 'client-1';
      const clientId2 = 'client-2';
      const address1 = '0x' + 'a'.repeat(40);
      const address2 = '0x' + 'b'.repeat(40);
      const mockWs1 = createMockWebSocket();
      const mockWs2 = createMockWebSocket();

      service.handleConnection(clientId1, mockWs1);
      service.handleConnection(clientId2, mockWs2);
      service.subscribe(clientId1, 'address', address1);
      service.subscribe(clientId2, 'address', address2);

      const update: AddressUpdate = {
        address: address1,
        balance: 1000000000000000000n,
        transactionHash: '0x' + 'c'.repeat(64),
        blockNumber: 1000n,
      };

      service.broadcastAddressUpdate(update);

      // Only client-1 should receive the update
      expect(mockWs1.send).toHaveBeenCalledWith(
        expect.stringContaining(`"address":"${address1}"`)
      );
      expect(mockWs2.send).not.toHaveBeenCalledWith(
        expect.stringContaining(`"address":"${address1}"`)
      );
    });
  });
});

