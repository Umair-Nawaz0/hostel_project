import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardAnalytics } from '../services/dashboardService.js';

export const getDashboardData = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(req.query.hostelId);

  res.status(200).json({
    success: true,
    message: 'Dashboard analytics fetched successfully',
    data: analytics,
  });
});
