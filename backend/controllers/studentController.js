import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/studentService.js';
export const getStudents = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Students fetched successfully',data:await service.getStudents({hostelId:req.query.hostelId?Number(req.query.hostelId):null,roomId:req.query.roomId?Number(req.query.roomId):null})}));
export const getStudentMeta = asyncHandler(async (req,res)=>{const metadata=await service.getStudentMetadata(); res.status(200).json({success:true,message:'Student metadata fetched successfully',statuses:metadata.statuses,data:metadata});});
export const createStudentRecord = asyncHandler(async (req,res)=>res.status(201).json({success:true,message:'Student created successfully',data:await service.createStudent(req.body)}));
export const updateStudentRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Student updated successfully',data:await service.updateStudent(Number(req.params.id),req.body)}));
export const deleteStudentRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Student deleted successfully',data:await service.deleteStudent(Number(req.params.id))}));
