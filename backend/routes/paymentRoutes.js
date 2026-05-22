import { Router } from 'express';
import { createPaymentRecord, deletePaymentRecord, getPayments, updatePaymentRecord } from '../controllers/paymentController.js';
import { validateIdParam, validateOptionalIdQuery, validateRequest } from '../middleware/validationMiddleware.js';
import { validatePaymentPayload } from '../utils/validators.js';
const router=Router(); router.get('/payments',validateOptionalIdQuery('hostelId'),getPayments); router.post('/payments',validateRequest(validatePaymentPayload),createPaymentRecord); router.put('/payments/:id',validateIdParam(),validateRequest(validatePaymentPayload),updatePaymentRecord); router.delete('/payments/:id',validateIdParam(),deletePaymentRecord); export default router;
