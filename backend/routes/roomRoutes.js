import { Router } from 'express';
import { createRoomRecord, deleteRoomRecord, getRoomMeta, getRooms, updateRoomRecord } from '../controllers/roomController.js';
import { validateIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { validateRoomPayload, validateRoomQuery } from '../utils/validators.js';
const router=Router(); router.get('/rooms/meta',getRoomMeta); router.get('/rooms',validateRequest(validateRoomQuery),getRooms); router.post('/rooms',validateRequest(validateRoomPayload),createRoomRecord); router.put('/rooms/:id',validateIdParam(),validateRequest(validateRoomPayload),updateRoomRecord); router.delete('/rooms/:id',validateIdParam(),deleteRoomRecord); export default router;
