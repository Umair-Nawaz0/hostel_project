import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/staffService.js';

export const getStaffRecords = asyncHandler(async (req, res) => {
  const staff = await service.getStaff({
    hostelId: req.query.hostelId ? Number(req.query.hostelId) : null,
    search: req.query.search || '',
  });

  res.status(200).json({
    success: true,
    message: 'Staff fetched successfully',
    count: staff.length,
    data: staff,
  });
});

export const createStaffRecord = asyncHandler(async (req, res) => {
  const createdStaff = await service.createStaff(req.body);

  res.status(201).json({
    success: true,
    message: 'Staff created successfully',
    data: createdStaff,
  });
});

export const updateStaffRecord = asyncHandler(async (req, res) => {
  const updatedStaff = await service.updateStaff(Number(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Staff updated successfully',
    data: updatedStaff,
  });
});

export const deleteStaffRecord = asyncHandler(async (req, res) => {
  const deletedStaff = await service.deleteStaff(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Staff deleted successfully',
    data: deletedStaff,
  });
});
