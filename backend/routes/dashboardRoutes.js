import { Router } from 'express';

import { getDashboardData } from '../controllers/dashboardController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { validateDashboardQuery } from '../utils/validators.js';

const router = Router();

router.get('/dashboard', validateRequest(validateDashboardQuery), getDashboardData);

export default router;
