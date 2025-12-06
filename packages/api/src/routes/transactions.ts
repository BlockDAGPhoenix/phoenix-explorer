import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { validateBlockHash, validateLimit, validateTransactionHash } from '../middleware/validation';

export function createTransactionRoutes(controller: TransactionController): Router {
  const router = Router();

  router.get('/latest', validateLimit, controller.getLatestTransactions.bind(controller));
  router.get('/by-block/:blockHash', validateBlockHash, controller.getTransactionsByBlockHash.bind(controller));
  router.get('/:hash', validateTransactionHash, controller.getTransactionByHash.bind(controller));

  return router;
}

