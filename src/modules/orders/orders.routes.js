import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as kdsController from '../kds/kds.controller.js';
import { updateOrderStatusSchema } from '../kds/kds.validator.js';
import * as paymentsController from '../payments/payments.controller.js';
import { settlePaymentSchema } from '../payments/payments.validator.js';
import * as ordersController from './orders.controller.js';
import { createOrderSchema } from './orders.validator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('manager', 'cashier'),
  validate(createOrderSchema),
  ordersController.createOrder
);

router.get('/', authenticate, ordersController.getOrders);
router.get('/:id', authenticate, ordersController.getOrderById);

// Order status transition endpoint for KDS and Staff
router.patch(
  '/:id/status',
  authenticate,
  authorize('kitchen', 'cashier', 'manager'),
  validate(updateOrderStatusSchema),
  kdsController.updateStatus
);

// Payment settlement endpoint (POST /api/orders/:id/settle)
router.post(
  '/:id/settle',
  authenticate,
  authorize('cashier', 'manager'),
  validate(settlePaymentSchema),
  paymentsController.settlePayment
);

export default router;
