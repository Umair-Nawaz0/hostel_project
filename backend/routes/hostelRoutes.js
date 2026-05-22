import { Router } from 'express';

import {
  createHostelRecord,
  deleteHostelRecord,
  getHostels,
  getSingleHostel,
  updateHostelRecord,
} from '../controllers/hostelController.js';
import { validateIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { validateHostelPayload } from '../utils/validators.js';

const router = Router();

// Hostel CRUD endpoints.
router.get('/hostels', getHostels);
router.get('/hostels/:id', validateIdParam(), getSingleHostel);
router.post('/hostels', validateRequest(validateHostelPayload), createHostelRecord);
router.put('/hostels/:id', validateIdParam(), validateRequest(validateHostelPayload), updateHostelRecord);
router.delete('/hostels/:id', validateIdParam(), deleteHostelRecord);

export default router;
