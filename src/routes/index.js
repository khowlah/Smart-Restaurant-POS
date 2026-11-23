import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import categoriesRoutes from '../modules/categories/categories.routes.js';
import kdsRoutes from '../modules/kds/kds.routes.js';
import menuRoutes from '../modules/menu/menu.routes.js';
import ordersRoutes from '../modules/orders/orders.routes.js';
import paymentsRoutes from '../modules/payments/payments.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';
import tablesRoutes from '../modules/tables/tables.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tablesRoutes);
router.use('/orders', ordersRoutes);
router.use('/kds', kdsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reports', reportsRoutes);

export default router;
