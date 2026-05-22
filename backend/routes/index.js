import { Router } from 'express';

import allocationRoutes from './allocationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import healthRoutes from './healthRoutes.js';
import hostelRoutes from './hostelRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import roomRoutes from './roomRoutes.js';
import staffRoutes from './staffRoutes.js';
import studentRoutes from './studentRoutes.js';
import wardenRoutes from './wardenRoutes.js';

const router = Router();

router.use(allocationRoutes);
router.use(dashboardRoutes);
router.use(healthRoutes);
router.use(hostelRoutes);
router.use(paymentRoutes);
router.use(roomRoutes);
router.use(staffRoutes);
router.use(studentRoutes);
router.use(wardenRoutes);

export default router;

