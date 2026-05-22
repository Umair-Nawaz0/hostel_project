import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/wardenService.js';

export const getWardenRecords = asyncHandler(async (req, res) => {
  const wardens = await service.getWardens({
    hostelId: req.query.hostelId ? Number(req.query.hostelId) : null,
    search: req.query.search || '',
  });

  res.status(200).json({
    success: true,
    message: 'Wardens fetched successfully',
    count: wardens.length,
    data: wardens,
  });
});

export const createWardenRecord = asyncHandler(async (req, res) => {
  const createdWarden = await service.createWarden(req.body);

  res.status(201).json({
    success: true,
    message: 'Warden created successfully',
    data: createdWarden,
  });
});

export const updateWardenRecord = asyncHandler(async (req, res) => {
  const updatedWarden = await service.updateWarden(Number(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Warden updated successfully',
    data: updatedWarden,
  });
});

export const deleteWardenRecord = asyncHandler(async (req, res) => {
  const deletedWarden = await service.deleteWarden(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Warden deleted successfully',
    data: deletedWarden,
  });
});
