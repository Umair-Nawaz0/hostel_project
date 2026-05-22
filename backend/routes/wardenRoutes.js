import { Router } from 'express';

import {
  createWardenRecord,
  deleteWardenRecord,
  getWardenRecords,
  updateWardenRecord,
} from '../controllers/wardenController.js';
import { validateIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { validateWardenPayload, validateWardenQuery } from '../utils/validators.js';

const router = Router();

router.get('/wardens', validateRequest(validateWardenQuery), getWardenRecords);
router.post('/wardens', validateRequest(validateWardenPayload), createWardenRecord);
router.put('/wardens/:id', validateIdParam(), validateRequest(validateWardenPayload), updateWardenRecord);
router.delete('/wardens/:id', validateIdParam(), deleteWardenRecord);

export default router;
