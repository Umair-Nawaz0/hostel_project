import { Router } from 'express';
import { createStaffRecord, deleteStaffRecord, getStaffRecords, updateStaffRecord } from '../controllers/staffController.js';
import { validateIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { validateStaffPayload, validateStaffQuery } from '../utils/validators.js';

const router = Router();

router.get('/staff', validateRequest(validateStaffQuery), getStaffRecords);
router.post('/staff', validateRequest(validateStaffPayload), createStaffRecord);
router.put('/staff/:id', validateIdParam(), validateRequest(validateStaffPayload), updateStaffRecord);
router.delete('/staff/:id', validateIdParam(), deleteStaffRecord);

export default router;
