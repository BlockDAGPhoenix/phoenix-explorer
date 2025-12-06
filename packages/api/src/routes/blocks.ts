import { Router } from 'express';
import { BlockController } from '../controllers/BlockController';
import { validateBlockNumber, validateBlockHash, validateLimit } from '../middleware/validation';

export function createBlockRoutes(controller: BlockController): Router {
  const router = Router();

  router.get('/latest', validateLimit, controller.getLatestBlocks.bind(controller));
  router.get('/:blockNumber', validateBlockNumber, controller.getBlockByNumber.bind(controller));
  router.get('/hash/:hash', validateBlockHash, controller.getBlockByHash.bind(controller));

  return router;
}

