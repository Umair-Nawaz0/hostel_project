import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/paymentService.js';
export const getPayments = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Payments fetched successfully',data:await service.getPayments({hostelId:req.query.hostelId?Number(req.query.hostelId):null,status:req.query.status||null})}));
export const createPaymentRecord = asyncHandler(async (req,res)=>res.status(201).json({success:true,message:'Payment created successfully',data:await service.createPayment(req.body)}));
export const updatePaymentRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Payment updated successfully',data:await service.updatePayment(Number(req.params.id),req.body)}));
export const deletePaymentRecord = asyncHandler(async (req,res)=>res.status(200).json({success:true,message:'Payment deleted successfully',data:await service.deletePayment(Number(req.params.id))}));
