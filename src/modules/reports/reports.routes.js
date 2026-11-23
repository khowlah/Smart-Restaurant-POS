import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.get('/summary', authenticate, authorize('manager'), reportsController.getSummary);

export default router;
