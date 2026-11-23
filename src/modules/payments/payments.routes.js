import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as paymentsController from './payments.controller.js';
import { settlePaymentSchema } from './payments.validator.js';

const router = Router();

router.post(
  '/:id/settle',
  authenticate,
  authorize('cashier', 'manager'),
  validate(settlePaymentSchema),
  paymentsController.settlePayment
);

export default router;
