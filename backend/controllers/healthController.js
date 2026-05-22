export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hostel ERP Backend Running',
  });
};
