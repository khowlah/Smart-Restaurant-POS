import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as categoriesController from './categories.controller.js';
import { createCategorySchema } from './categories.validator.js';

const router = Router();

router.get('/', categoriesController.getCategories);
router.post('/', authenticate, authorize('manager'), validate(createCategorySchema), categoriesController.createCategory);

export default router;
