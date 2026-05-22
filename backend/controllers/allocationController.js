import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/allocationService.js';
export const getAllocations = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Allocations fetched successfully',data:await service.getAllocations({hostelId:req.query.hostelId?Number(req.query.hostelId):null})}));
export const getAllocationMeta = asyncHandler(async (req,res)=>{const metadata=await service.getAllocationMetadata(); res.status(200).json({success:true,message:'Allocation metadata fetched successfully',bedIds:metadata.bedIds,data:metadata});});
export const createAllocationRecord = asyncHandler(async (req,res)=>res.status(201).json({success:true,message:'Allocation created successfully',data:await service.createAllocation(req.body)}));
export const updateAllocationRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Allocation updated successfully',data:await service.updateAllocation(Number(req.params.id),req.body)}));
export const deleteAllocationRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Allocation deleted successfully',data:await service.deleteAllocation(Number(req.params.id))}));
