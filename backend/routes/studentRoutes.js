import { Router } from 'express';
import { createStudentRecord, deleteStudentRecord, getStudentMeta, getStudents, updateStudentRecord } from '../controllers/studentController.js';
import { validateIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { validateStudentPayload, validateStudentQuery } from '../utils/validators.js';
const router=Router(); router.get('/students/meta',getStudentMeta); router.get('/students',validateRequest(validateStudentQuery),getStudents); router.post('/students',validateRequest(validateStudentPayload),createStudentRecord); router.put('/students/:id',validateIdParam(),validateRequest(validateStudentPayload),updateStudentRecord); router.delete('/students/:id',validateIdParam(),deleteStudentRecord); export default router;
