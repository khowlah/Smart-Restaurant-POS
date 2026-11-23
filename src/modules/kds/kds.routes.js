import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as kdsController from './kds.controller.js';
import { updateOrderStatusSchema } from './kds.validator.js';

const router = Router();

router.get('/orders', authenticate, authorize('kitchen', 'cashier', 'manager'), kdsController.getKdsOrders);
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize('kitchen', 'cashier', 'manager'),
  validate(updateOrderStatusSchema),
  kdsController.updateStatus
);

export default router;
