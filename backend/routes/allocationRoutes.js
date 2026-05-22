import { Router } from 'express';
import { createAllocationRecord, deleteAllocationRecord, getAllocationMeta, getAllocations, updateAllocationRecord } from '../controllers/allocationController.js';
import { validateIdParam, validateOptionalIdQuery, validateRequest } from '../middleware/validationMiddleware.js';
import { validateAllocationPayload } from '../utils/validators.js';
const router=Router(); router.get('/allocations/meta',getAllocationMeta); router.get('/allocations',validateOptionalIdQuery('hostelId'),getAllocations); router.post('/allocations',validateRequest(validateAllocationPayload),createAllocationRecord); router.put('/allocations/:id',validateIdParam(),validateRequest(validateAllocationPayload),updateAllocationRecord); router.delete('/allocations/:id',validateIdParam(),deleteAllocationRecord); export default router;
