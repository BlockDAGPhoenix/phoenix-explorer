import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createBlockRoutes } from './routes/blocks';
import { createTransactionRoutes } from './routes/transactions';
import { createAddressRoutes } from './routes/addresses';
import { createDAGRoutes } from './routes/dag';
import { createStatisticsRoutes } from './routes/statistics';
import { createSearchRoutes } from './routes/search';
import { BlockController } from './controllers/BlockController';
import { TransactionController } from './controllers/TransactionController';
import { AddressController } from './controllers/AddressController';
import { DAGController } from './controllers/DAGController';
import { StatisticsController } from './controllers/StatisticsController';
import { SearchController } from './controllers/SearchController';
import { IBlockService } from './interfaces/services/IBlockService';
import { ITransactionService } from './interfaces/services/ITransactionService';
import { IAddressService } from './interfaces/services/IAddressService';
import { IDAGService } from './interfaces/services/IDAGService';
import { IStatisticsService } from './interfaces/services/IStatisticsService';
import { ISearchService } from './interfaces/services/ISearchService';

export function createApp(
  blockService: IBlockService,
  transactionService: ITransactionService,
  addressService: IAddressService,
  dagService: IDAGService,
  statisticsService: IStatisticsService,
  searchService: ISearchService
): Express {
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:6663',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // Security middleware
  app.use(helmet());
  
  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  const blockController = new BlockController(blockService);
  const transactionController = new TransactionController(transactionService);
  const addressController = new AddressController(addressService);
  const dagController = new DAGController(dagService);
  const statisticsController = new StatisticsController(statisticsService);
  const searchController = new SearchController(searchService);
  
  app.use('/v1/blocks', createBlockRoutes(blockController));
  app.use('/v1/transactions', createTransactionRoutes(transactionController));
  app.use('/v1/addresses', createAddressRoutes(addressController));
  app.use('/v1/dag', createDAGRoutes(dagController));
  app.use('/v1', createStatisticsRoutes(statisticsController));
  app.use('/v1/search', createSearchRoutes(searchController));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

