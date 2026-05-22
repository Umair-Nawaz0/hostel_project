// SQL Injection Prevention Applied:
// 1. Route handlers only accept sanitized inputs from middleware.
// 2. Services use parameterized queries with mysql2 placeholders.
// 3. This file strips obvious XSS payload characters and normalizes user input.


const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;
const ANGLE_BRACKET_REGEX = /[<>]/g;

export const sanitizeString = (value) =>
  value
    .replace(CONTROL_CHAR_REGEX, '')
    .replace(ANGLE_BRACKET_REGEX, '')
    .trim();

export const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeValue(child)]));
  }
  return value;
};

export const safeInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isValidPhone = (value) => /^[+0-9()\-\s]{7,20}$/.test(value);
export const isValidCnic = (value) => /^\d{5}-?\d{7}-?\d$/.test(value);
export const isNonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
