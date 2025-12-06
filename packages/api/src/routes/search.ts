import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

export function createSearchRoutes(controller: SearchController): Router {
  const router = Router();

  router.get('/', controller.search.bind(controller));

  return router;
}

