import { Router } from 'express';
import { DAGController } from '../controllers/DAGController';
import { validateBlockNumber, validateBlockHash } from '../middleware/validation';

export function createDAGRoutes(controller: DAGController): Router {
  const router = Router();

  router.get('/blocks/:blockNumber/dag', validateBlockNumber, controller.getBlockDAGInfo.bind(controller));
  router.get('/blocks/:blockHash/parents', validateBlockHash, controller.getBlockParents.bind(controller));
  router.get('/blocks/:blockHash/children', validateBlockHash, controller.getBlockChildren.bind(controller));

  return router;
}

