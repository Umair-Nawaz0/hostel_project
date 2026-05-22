import { sanitizeValue, safeInteger } from '../utils/security.js';

const buildValidationError = (errors) => {
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.errors = errors;
  return error;
};

// SQL Injection Prevention Applied:
// Every request is sanitized before it reaches controller/service code.
export const sanitizeRequestMiddleware = (req, res, next) => {
  req.body = sanitizeValue(req.body || {});
  req.query = sanitizeValue(req.query || {});
  req.params = sanitizeValue(req.params || {});
  next();
};

export const validateRequest = (validator) => (req, res, next) => {
  const errors = validator(req);
  if (errors.length > 0) {
    next(buildValidationError(errors));
    return;
  }
  next();
};

export const validateIdParam = (paramName = 'id') =>
  validateRequest((req) => {
    const value = safeInteger(req.params[paramName]);
    return value && value > 0 ? [] : [{ field: paramName, message: `${paramName} must be a positive integer` }];
  });

export const validateOptionalIdQuery = (paramName) =>
  validateRequest((req) => {
    const rawValue = req.query[paramName];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return [];
    }
    const value = safeInteger(rawValue);
    return value && value > 0 ? [] : [{ field: paramName, message: `${paramName} must be a positive integer` }];
  });
