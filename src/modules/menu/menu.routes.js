import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as menuController from './menu.controller.js';
import { createMenuItemSchema, queryMenuSchema, updateAvailabilitySchema } from './menu.validator.js';

const router = Router();

router.get('/', validate(queryMenuSchema), menuController.getMenu);
router.post('/', authenticate, authorize('manager'), validate(createMenuItemSchema), menuController.createMenuItem);
router.patch('/:id/availability', authenticate, authorize('manager'), validate(updateAvailabilitySchema), menuController.updateAvailability);

export default router;
