export const schemaDefinition = {
  Hostel: {
    required: ['hostel_name', 'address', 'city', 'total_rooms', 'contact_phone', 'email'],
    nullable: ['established_yr', 'warden_id'],
    lengths: {
      hostel_name: { min: 3, max: 120 },
      city: { max: 80 },
      contact_phone: { max: 20 },
      email: { max: 100 },
    },
  },
  Warden: {
    required: ['full_name', 'email', 'phone', 'cnic'],
    nullable: [],
    lengths: {
      full_name: { max: 100 },
      email: { max: 100 },
      phone: { max: 20 },
      cnic: { max: 15 },
    },
  },
  Room: {
    required: ['room_number', 'floor', 'room_type', 'capacity', 'monthly_fee', 'status', 'hostel_id'],
    nullable: [],
    lengths: {
      room_number: { max: 5 },
    },
    enums: {
      room_type: ['Single', 'Double', 'Triple', 'Quad'],
      status: ['Available', 'Occupied', 'Under Maintenance'],
    },
  },
  Student: {
    required: ['roll_number', 'full_name', 'email', 'phone', 'department', 'program', 'join_date', 'status'],
    nullable: ['guardian_name', 'guardian_phone'],
    lengths: {
      roll_number: { min: 3, max: 20 },
      full_name: { min: 2, max: 100 },
      email: { max: 100 },
      phone: { max: 20 },
      department: { max: 100 },
      program: { max: 60 },
      guardian_name: { max: 100 },
      guardian_phone: { max: 20 },
    },
    enums: {
      status: ['Active', 'Vacated', 'Suspended'],
    },
  },
  Staff: {
    required: ['full_name', 'role', 'phone', 'salary', 'hostel_id'],
    nullable: ['email'],
    lengths: {
      full_name: { max: 100 },
      role: { max: 60 },
      phone: { max: 20 },
      email: { max: 100 },
    },
  },
  Allocation: {
    required: ['student_id', 'room_id', 'allocated_date', 'bed_id'],
    nullable: ['vacated_date'],
    enums: {
      bed_id: ['1', '2', '3', '4', '5'],
    },
  },
  FeePayment: {
    required: ['student_id', 'amount', 'payment_date', 'due_date', 'month_year', 'method', 'status'],
    nullable: ['remarks'],
    lengths: {
      month_year: { max: 10 },
      remarks: { max: 255 },
    },
    enums: {
      method: ['Cash', 'Bank Transfer', 'Online', 'Cheque'],
      status: ['Paid', 'Pending', 'Overdue'],
    },
  },
};

export default schemaDefinition;
