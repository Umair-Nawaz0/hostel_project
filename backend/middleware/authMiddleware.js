import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

// Starter auth middleware for protected routes.
export const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, env.jwt.secret);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
