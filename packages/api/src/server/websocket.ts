import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { IWebSocketService } from '../interfaces/services/IWebSocketService';

/**
 * WebSocket Server Setup
 * Creates and configures WebSocket server
 */
export function setupWebSocketServer(
  httpServer: Server,
  webSocketService: IWebSocketService
): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket) => {
    // Generate unique client ID
    const clientId = randomUUID();

    // Handle connection
    webSocketService.handleConnection(clientId, ws);

    // Log connection (optional)
    console.log(`WebSocket client connected: ${clientId}`);
  });

  return wss;
}

