import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/roomService.js';
export const getRooms = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Rooms fetched successfully',data:await service.getRooms({hostelId:req.query.hostelId?Number(req.query.hostelId):null,search:req.query.search||''})}));
export const getRoomMeta = asyncHandler(async (req,res)=>{const metadata=await service.getRoomMetadata(); res.status(200).json({success:true,message:'Room metadata fetched successfully',roomTypes:metadata.roomTypes,roomStatuses:metadata.roomStatuses,data:metadata});});
export const createRoomRecord = asyncHandler(async (req,res)=>res.status(201).json({success:true,message:'Room created successfully',data:await service.createRoom(req.body)}));
export const updateRoomRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Room updated successfully',data:await service.updateRoom(Number(req.params.id),req.body)}));
export const deleteRoomRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Room deleted successfully',data:await service.deleteRoom(Number(req.params.id))}));
