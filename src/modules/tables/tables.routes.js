import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as tablesController from './tables.controller.js';
import { updateTableStatusSchema } from './tables.validator.js';

const router = Router();

router.get('/', authenticate, tablesController.getTables);
router.patch(
  '/:id/status',
  authenticate,
  authorize('manager', 'cashier'),
  validate(updateTableStatusSchema),
  tablesController.updateTableStatus
);

export default router;
