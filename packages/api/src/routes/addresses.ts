import { Router } from 'express';
import { AddressController } from '../controllers/AddressController';
import { validateLimit } from '../middleware/validation';

export function createAddressRoutes(controller: AddressController): Router {
  const router = Router();

  router.get('/:address', controller.getAddress.bind(controller));
  router.get('/:address/balance', controller.getAddressBalance.bind(controller));
  router.get('/:address/transactions', validateLimit, controller.getAddressTransactions.bind(controller));

  return router;
}

