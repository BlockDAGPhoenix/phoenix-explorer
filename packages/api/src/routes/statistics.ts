import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';

export function createStatisticsRoutes(controller: StatisticsController): Router {
  const router = Router();

  router.get('/blocks/stats', controller.getBlockStatistics.bind(controller));
  router.get('/network/stats', controller.getNetworkStatistics.bind(controller));

  return router;
}

