import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createHostel,
  deleteHostel,
  getAllHostels,
  getHostelById,
  updateHostel,
} from '../services/hostelService.js';

export const getHostels = asyncHandler(async (req, res) => {
  const hostels = await getAllHostels();

  res.status(200).json({
    success: true,
    message: 'Hostels fetched successfully',
    count: hostels.length,
    data: hostels,
  });
});

export const getSingleHostel = asyncHandler(async (req, res) => {
  const hostel = await getHostelById(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Hostel fetched successfully',
    data: hostel,
  });
});

export const createHostelRecord = asyncHandler(async (req, res) => {
  const hostel = await createHostel(req.body);

  res.status(201).json({
    success: true,
    message: 'Hostel created successfully',
    data: hostel,
  });
});

export const updateHostelRecord = asyncHandler(async (req, res) => {
  const hostel = await updateHostel(Number(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Hostel updated successfully',
    data: hostel,
  });
});

export const deleteHostelRecord = asyncHandler(async (req, res) => {
  const deletedHostel = await deleteHostel(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Hostel deleted successfully',
    data: deletedHostel,
  });
});
