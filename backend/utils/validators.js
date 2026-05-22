import { schemaDefinition } from '../config/schemaDefinition.js';
import { isNonEmpty, isValidCnic, isValidEmail, isValidPhone, safeInteger } from './security.js';

const requireFields = (source, fields, errors) => {
  fields.forEach((field) => {
    const value = source[field];
    if (value === undefined || value === null || (typeof value === 'string' && !isNonEmpty(value))) {
      errors.push({ field, message: `${field} is required` });
    }
  });
};

const validateEnum = (source, enums, errors) => {
  Object.entries(enums).forEach(([field, allowed]) => {
    if (source[field] !== undefined && source[field] !== null && !allowed.includes(source[field])) {
      errors.push({ field, message: `${field} must be one of: ${allowed.join(', ')}` });
    }
  });
};

const validateLengths = (source, lengths, errors) => {
  Object.entries(lengths).forEach(([field, rule]) => {
    const value = source[field];
    if (typeof value === 'string' && rule.min && value.length < rule.min) {
      errors.push({ field, message: `${field} must be at least ${rule.min} characters` });
    }
    if (typeof value === 'string' && rule.max && value.length > rule.max) {
      errors.push({ field, message: `${field} must be at most ${rule.max} characters` });
    }
  });
};

const validateEmailField = (source, field, errors, optional = false) => {
  if ((optional && !source[field]) || source[field] === undefined) return;
  if (!isValidEmail(source[field])) errors.push({ field, message: `${field} must be a valid email address` });
};

const validatePhoneField = (source, field, errors, optional = false) => {
  if ((optional && !source[field]) || source[field] === undefined) return;
  if (!isValidPhone(source[field])) errors.push({ field, message: `${field} must be a valid phone number` });
};

const validatePositiveInteger = (source, field, errors, allowNull = false) => {
  if (allowNull && (source[field] === null || source[field] === undefined || source[field] === '')) return;
  const value = safeInteger(source[field]);
  if (!value || value <= 0) errors.push({ field, message: `${field} must be a positive integer` });
};

const validateNonNegativeNumber = (source, field, errors) => {
  const value = Number(source[field]);
  if (Number.isNaN(value) || value < 0) errors.push({ field, message: `${field} must be a non-negative number` });
};

const validateDate = (source, field, errors, optional = false) => {
  if ((optional && !source[field]) || source[field] === undefined) return;
  if (Number.isNaN(Date.parse(source[field]))) errors.push({ field, message: `${field} must be a valid date` });
};

const validateYearField = (source, field, errors, optional = false) => {
  if ((optional && !source[field]) || source[field] === undefined || source[field] === null || source[field] === '') return;
  const value = safeInteger(source[field]);
  if (!value || value < 1901 || value > 2155) {
    errors.push({ field, message: `${field} must be a valid year` });
  }
};

export const validateHostelPayload = (req) => {
  const errors = [];
  requireFields(req.body, schemaDefinition.Hostel.required, errors);
  validateLengths(req.body, schemaDefinition.Hostel.lengths, errors);
  validateEmailField(req.body, 'email', errors);
  validatePhoneField(req.body, 'contact_phone', errors);
  validatePositiveInteger(req.body, 'total_rooms', errors);
  validateYearField(req.body, 'established_yr', errors, true);
  if (!isNonEmpty(req.body.hostel_name || '')) errors.push({ field: 'hostel_name', message: 'hostel_name cannot be blank' });
  if (!isNonEmpty(req.body.address || '')) errors.push({ field: 'address', message: 'address cannot be blank' });
  if (!isNonEmpty(req.body.city || '')) errors.push({ field: 'city', message: 'city cannot be blank' });
  if (!isNonEmpty(req.body.contact_phone || '')) errors.push({ field: 'contact_phone', message: 'contact_phone cannot be blank' });
  if (!isNonEmpty(req.body.email || '')) errors.push({ field: 'email', message: 'email cannot be blank' });
  if (req.body.warden_id !== undefined && req.body.warden_id !== null && req.body.warden_id !== '') {
    validatePositiveInteger(req.body, 'warden_id', errors, true);
  }
  return errors;
};

export const validateStudentPayload = (req) => {
  const errors = [];
  requireFields(req.body, ['roll_number', 'full_name', 'email', 'phone', 'department', 'program', 'join_date', 'status'], errors);
  validateEnum(req.body, schemaDefinition.Student.enums, errors);
  validateLengths(req.body, schemaDefinition.Student.lengths, errors);
  validateEmailField(req.body, 'email', errors);
  validatePhoneField(req.body, 'phone', errors);
  validatePhoneField(req.body, 'guardian_phone', errors, true);
  validateDate(req.body, 'join_date', errors);
  if (!isNonEmpty(req.body.roll_number || '')) errors.push({ field: 'roll_number', message: 'roll_number cannot be blank' });
  if (!isNonEmpty(req.body.full_name || '')) errors.push({ field: 'full_name', message: 'full_name cannot be blank' });
  if (!isNonEmpty(req.body.department || '')) errors.push({ field: 'department', message: 'department cannot be blank' });
  if (!isNonEmpty(req.body.program || '')) errors.push({ field: 'program', message: 'program cannot be blank' });
  return errors;
};

export const validateRoomPayload = (req) => {
  const errors = [];
  const roomNumberRaw = req.body.room_number ?? req.body.roomNumber ?? '';
  const roomNumber = String(roomNumberRaw)
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '');
  const floor = Number(req.body.floor);
  const capacity = Number(req.body.capacity);
  const monthlyFee = Number(req.body.monthly_fee);

  requireFields(req.body, schemaDefinition.Room.required, errors);
  if (roomNumberRaw === undefined || roomNumberRaw === null || roomNumber === '') {
    errors.push({ field: 'room_number', message: 'room_number cannot be blank' });
  } else if (!/^[A-Z]-\d{3}$/.test(roomNumber)) {
    errors.push({ field: 'room_number', message: 'room_number must follow the format A-101, B-203, or C-304' });
  }

  if (!Number.isInteger(floor) || floor < 0) {
    errors.push({ field: 'floor', message: 'floor must be a non-negative integer' });
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.push({ field: 'capacity', message: 'capacity must be a positive integer' });
  }

  if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
    errors.push({ field: 'monthly_fee', message: 'monthly_fee must be a non-negative number' });
  }

  if (req.body.room_type !== undefined && req.body.room_type !== null && req.body.room_type !== '' && typeof req.body.room_type !== 'string') {
    errors.push({ field: 'room_type', message: 'room_type must be a string or null' });
  }

  if (req.body.status !== undefined && req.body.status !== null && typeof req.body.status !== 'string') {
    errors.push({ field: 'status', message: 'status must be a string' });
  }

  validateLengths({ room_number: roomNumber }, schemaDefinition.Room.lengths, errors);
  validatePositiveInteger(req.body, 'hostel_id', errors);
  return errors;
};

export const validateStaffPayload = (req) => {
  const errors = [];
  requireFields(req.body, ['full_name', 'role', 'phone', 'salary', 'hostel_id'], errors);
  validateLengths(req.body, schemaDefinition.Staff.lengths, errors);
  validateEmailField(req.body, 'email', errors, true);
  validatePhoneField(req.body, 'phone', errors);
  if (!isNonEmpty(req.body.full_name || '')) errors.push({ field: 'full_name', message: 'full_name cannot be blank' });
  if (!isNonEmpty(req.body.role || '')) errors.push({ field: 'role', message: 'role cannot be blank' });
  if (!isNonEmpty(req.body.phone || '')) errors.push({ field: 'phone', message: 'phone cannot be blank' });
  validatePositiveInteger(req.body, 'hostel_id', errors);
  validateNonNegativeNumber(req.body, 'salary', errors);
  return errors;
};

export const validateWardenPayload = (req) => {
  const errors = [];
  requireFields(req.body, schemaDefinition.Warden.required, errors);
  validateLengths(req.body, schemaDefinition.Warden.lengths, errors);
  validateEmailField(req.body, 'email', errors);
  validatePhoneField(req.body, 'phone', errors);
  if (!isNonEmpty(req.body.full_name || '')) errors.push({ field: 'full_name', message: 'full_name cannot be blank' });
  if (!isNonEmpty(req.body.email || '')) errors.push({ field: 'email', message: 'email cannot be blank' });
  if (!isNonEmpty(req.body.phone || '')) errors.push({ field: 'phone', message: 'phone cannot be blank' });
  if (!isNonEmpty(req.body.cnic || '')) {
    errors.push({ field: 'cnic', message: 'cnic cannot be blank' });
  } else if (!isValidCnic(req.body.cnic)) {
    errors.push({ field: 'cnic', message: 'cnic must be a valid CNIC' });
  }
  return errors;
};

export const validatePaymentPayload = (req) => {
  const errors = [];
  requireFields(req.body, ['student_id', 'amount', 'payment_date', 'due_date', 'month_year', 'method', 'status'], errors);
  validateEnum(req.body, schemaDefinition.FeePayment.enums, errors);
  validatePositiveInteger(req.body, 'student_id', errors);
  if (Number(req.body.amount) <= 0 || Number.isNaN(Number(req.body.amount))) errors.push({ field: 'amount', message: 'amount must be greater than zero' });
  validateDate(req.body, 'payment_date', errors);
  validateDate(req.body, 'due_date', errors);
  return errors;
};

export const validateAllocationPayload = (req) => {
  const errors = [];
  const isCreate = req.method === 'POST';
  const status = req.body.status;
  const allocatedDate = req.body.allocated_date ?? req.body.date;
  const vacatedDate = req.body.vacated_date ?? req.body.vacatedDate;

  if (isCreate) {
    requireFields(req.body, ['student_id', 'room_id', 'bed_id', 'allocated_date'], errors);
  }

  if (req.body.student_id !== undefined || req.body.studentId !== undefined || isCreate) {
    validatePositiveInteger({ student_id: req.body.student_id ?? req.body.studentId }, 'student_id', errors);
  }

  if (req.body.room_id !== undefined || req.body.roomId !== undefined || isCreate) {
    validatePositiveInteger({ room_id: req.body.room_id ?? req.body.roomId }, 'room_id', errors);
  }

  if (req.body.bed_id !== undefined || req.body.bedId !== undefined || isCreate) {
    const bedId = String(req.body.bed_id ?? req.body.bedId ?? '').trim();
    if (!schemaDefinition.Allocation.enums.bed_id.includes(bedId)) {
      errors.push({ field: 'bed_id', message: `bed_id must be one of: ${schemaDefinition.Allocation.enums.bed_id.join(', ')}` });
    }
  }

  if (req.body.allocated_date !== undefined || req.body.date !== undefined || isCreate) {
    validateDate({ allocated_date: allocatedDate }, 'allocated_date', errors);
  }

  validateDate({ vacated_date: vacatedDate }, 'vacated_date', errors, true);

  if (status !== undefined && status !== null && !['Active', 'Vacated'].includes(status)) {
    errors.push({ field: 'status', message: 'status must be either Active or Vacated' });
  }

  if (status === 'Vacated' && !vacatedDate) {
    errors.push({ field: 'vacated_date', message: 'vacated_date is required when status is Vacated' });
  }

  if (allocatedDate && vacatedDate && !Number.isNaN(Date.parse(allocatedDate)) && !Number.isNaN(Date.parse(vacatedDate))) {
    if (new Date(vacatedDate) < new Date(allocatedDate)) {
      errors.push({ field: 'vacated_date', message: 'vacated_date cannot be earlier than allocated_date' });
    }
  }

  return errors;
};

export const validateDashboardQuery = (req) => {
  const errors = [];
  if (req.query.hostelId !== undefined && req.query.hostelId !== '' && (!safeInteger(req.query.hostelId) || safeInteger(req.query.hostelId) <= 0)) {
    errors.push({ field: 'hostelId', message: 'hostelId must be a positive integer' });
  }
  return errors;
};

export const validateRoomQuery = (req) => {
  const errors = [];

  if (req.query.hostelId !== undefined && req.query.hostelId !== '' && (!safeInteger(req.query.hostelId) || safeInteger(req.query.hostelId) <= 0)) {
    errors.push({ field: 'hostelId', message: 'hostelId must be a positive integer' });
  }

  if (req.query.search !== undefined && req.query.search !== null && typeof req.query.search !== 'string') {
    errors.push({ field: 'search', message: 'search must be a string' });
  }

  return errors;
};

export const validateStudentQuery = (req) => {
  const errors = [];

  if (req.query.hostelId !== undefined && req.query.hostelId !== '' && (!safeInteger(req.query.hostelId) || safeInteger(req.query.hostelId) <= 0)) {
    errors.push({ field: 'hostelId', message: 'hostelId must be a positive integer' });
  }

  if (req.query.roomId !== undefined && req.query.roomId !== '' && (!safeInteger(req.query.roomId) || safeInteger(req.query.roomId) <= 0)) {
    errors.push({ field: 'roomId', message: 'roomId must be a positive integer' });
  }

  return errors;
};

export const validateStaffQuery = (req) => {
  const errors = [];

  if (req.query.hostelId !== undefined && req.query.hostelId !== '' && (!safeInteger(req.query.hostelId) || safeInteger(req.query.hostelId) <= 0)) {
    errors.push({ field: 'hostelId', message: 'hostelId must be a positive integer' });
  }

  if (req.query.search !== undefined && req.query.search !== null && typeof req.query.search !== 'string') {
    errors.push({ field: 'search', message: 'search must be a string' });
  }

  return errors;
};

export const validateWardenQuery = (req) => {
  const errors = [];

  if (req.query.hostelId !== undefined && req.query.hostelId !== '' && (!safeInteger(req.query.hostelId) || safeInteger(req.query.hostelId) <= 0)) {
    errors.push({ field: 'hostelId', message: 'hostelId must be a positive integer' });
  }

  if (req.query.search !== undefined && req.query.search !== null && typeof req.query.search !== 'string') {
    errors.push({ field: 'search', message: 'search must be a string' });
  }

  return errors;
};
