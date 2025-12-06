import { createServer } from 'http';
import { Pool } from 'pg';
import { createApp } from './app';
import { setupWebSocketServer } from './server/websocket';
import { WebSocketService } from './services/WebSocketService';
import { BlockService } from './services/BlockService';
import { TransactionService } from './services/TransactionService';
import { AddressService } from './services/AddressService';
import { DAGService } from './services/DAGService';
import { StatisticsService } from './services/StatisticsService';
import { SearchService } from './services/SearchService';
import { BlockRepository } from './repositories/BlockRepository';
import { TransactionRepository } from './repositories/TransactionRepository';
import { AddressRepository } from './repositories/AddressRepository';
import { DAGRepository } from './repositories/DAGRepository';
import { StatisticsRepository } from './repositories/StatisticsRepository';

const PORT = process.env.PORT || 6662;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable';

async function main() {
  // Initialize database connection
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Initialize repositories
  const blockRepository = new BlockRepository(pool);
  const transactionRepository = new TransactionRepository(pool);
  const addressRepository = new AddressRepository(pool);
  const dagRepository = new DAGRepository(pool);
  const statisticsRepository = new StatisticsRepository(pool);

  // Initialize services
  const blockService = new BlockService(blockRepository);
  const transactionService = new TransactionService(transactionRepository);
  const addressService = new AddressService(addressRepository);
  const dagService = new DAGService(dagRepository, blockRepository);
  const statisticsService = new StatisticsService(statisticsRepository);
  const searchService = new SearchService(blockRepository, transactionRepository, addressRepository);

  // Create Express app
  const app = createApp(blockService, transactionService, addressService, dagService, statisticsService, searchService);

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const webSocketService = new WebSocketService();
  setupWebSocketServer(httpServer, webSocketService);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Blocks API: http://localhost:${PORT}/v1/blocks`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
    await pool.end();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

