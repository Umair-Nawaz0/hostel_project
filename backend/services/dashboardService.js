import { getDatabasePool } from '../config/db.js';

const pool = getDatabasePool();

const buildDatabaseError = (error) => {
  const databaseError = new Error(`Database operation failed: ${error.message}`);
  databaseError.statusCode = error.statusCode || 500;
  return databaseError;
};

const buildValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const buildNotFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const buildMonthLabels = () => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const labels = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    labels.push(formatter.format(date));
  }

  return labels;
};

const buildMonthKeys = () => {
  const keys = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    keys.push(date.toISOString().slice(0, 7));
  }

  return keys;
};

const normalizeHostelId = (hostelId) => {
  if (hostelId === undefined || hostelId === null || hostelId === '') {
    return null;
  }

  const normalizedId = Number(hostelId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw buildValidationError('hostelId must be a positive integer');
  }

  return normalizedId;
};

const createScopeClause = (column, hostelId) => {
  if (!hostelId) {
    return {
      sql: '',
      params: [],
    };
  }

  return {
    sql: ` WHERE ${column} = ?`,
    params: [hostelId],
  };
};

const createScopeAndClause = (column, hostelId) => {
  if (!hostelId) {
    return {
      sql: '',
      params: [],
    };
  }

  return {
    sql: ` AND ${column} = ?`,
    params: [hostelId],
  };
};

const mapMonthlyActivity = (rows, monthKeys) => {
  const activityMap = new Map();

  rows.forEach((row) => {
    const key = row.month_key;
    activityMap.set(key, Number(row.activity_count || 0));
  });

  return monthKeys.map((monthKey) => activityMap.get(monthKey) || 0);
};

export const getDashboardAnalytics = async (hostelIdQuery) => {
  try {
    const hostelId = normalizeHostelId(hostelIdQuery);
    const monthLabels = buildMonthLabels();
    const monthKeys = buildMonthKeys();

    const [hostelListRows] = await pool.query(
      'SELECT hostel_id, hostel_name FROM Hostel ORDER BY hostel_name ASC',
    );

    if (hostelId && !hostelListRows.some((row) => Number(row.hostel_id) === hostelId)) {
      throw buildNotFoundError('Hostel not found');
    }

    const hostelScope = createScopeClause('h.hostel_id', hostelId);
    const roomScope = createScopeClause('hostel_id', hostelId);
    const staffScope = createScopeClause('hostel_id', hostelId);
    const allocationRoomScope = createScopeAndClause('r.hostel_id', hostelId);

    const [
      [hostelTotalsRows],
      [roomTotalsRows],
      [occupiedRoomRows],
      [studentTotalRows],
      [staffTotalRows],
      [activeAllocationRows],
      [selectedHostelRows],
      [activityRows],
    ] = await Promise.all([
      hostelId
        ? Promise.resolve([[{ total_hostels: 1 }]])
        : pool.query('SELECT COUNT(*) AS total_hostels FROM Hostel'),
      pool.query(
        `SELECT COUNT(*) AS total_rooms FROM Room${roomScope.sql}`,
        roomScope.params,
      ),
      pool.query(
        `
          SELECT COUNT(DISTINCT a.room_id) AS occupied_rooms
          FROM Allocation a
          INNER JOIN Room r ON r.room_id = a.room_id
          WHERE a.vacated_date IS NULL${allocationRoomScope.sql}
        `,
        allocationRoomScope.params,
      ),
      pool.query(
        `
          SELECT COUNT(DISTINCT a.student_id) AS total_students
          FROM Allocation a
          INNER JOIN Room r ON r.room_id = a.room_id
          INNER JOIN Student s ON s.student_id = a.student_id
          WHERE a.vacated_date IS NULL
            AND s.status = 'Active'${allocationRoomScope.sql}
        `,
        allocationRoomScope.params,
      ),
      pool.query(
        `SELECT COUNT(*) AS total_staff FROM Staff${staffScope.sql}`,
        staffScope.params,
      ),
      pool.query(
        `
          SELECT COUNT(*) AS active_allocations
          FROM Allocation a
          INNER JOIN Room r ON r.room_id = a.room_id
          WHERE a.vacated_date IS NULL${allocationRoomScope.sql}
        `,
        allocationRoomScope.params,
      ),
      pool.query(
        `
          SELECT
            h.hostel_id,
            h.hostel_name,
            COUNT(DISTINCT r.room_id) AS total_rooms,
            COUNT(DISTINCT CASE
              WHEN a.vacated_date IS NULL THEN a.room_id
            END) AS occupied_rooms,
            COUNT(DISTINCT CASE
              WHEN a.vacated_date IS NULL THEN a.student_id
            END) AS total_students,
            COUNT(DISTINCT s.staff_id) AS total_staff,
            COUNT(DISTINCT CASE
              WHEN a.vacated_date IS NULL THEN a.student_id
            END) AS active_allocations
          FROM Hostel h
          LEFT JOIN Room r ON r.hostel_id = h.hostel_id
          LEFT JOIN Allocation a ON a.room_id = r.room_id
            AND a.vacated_date IS NULL
          LEFT JOIN Staff s ON s.hostel_id = h.hostel_id
          ${hostelScope.sql}
          GROUP BY h.hostel_id, h.hostel_name
          ORDER BY h.hostel_name ASC
        `,
        hostelScope.params,
      ),
      pool.query(
        `
          SELECT
            DATE_FORMAT(a.allocated_date, '%Y-%m') AS month_key,
            COUNT(*) AS activity_count
          FROM Allocation a
          INNER JOIN Room r ON r.room_id = a.room_id
          WHERE a.allocated_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
          ${hostelId ? 'AND r.hostel_id = ?' : ''}
          GROUP BY DATE_FORMAT(a.allocated_date, '%Y-%m')
          ORDER BY month_key ASC
        `,
        hostelId ? [hostelId] : [],
      ),
    ]);

    const totalHostels = Number(hostelTotalsRows[0]?.total_hostels || 0);
    const totalRooms = Number(roomTotalsRows[0]?.total_rooms || 0);
    const occupiedRooms = Number(occupiedRoomRows[0]?.occupied_rooms || 0);
    const availableRooms = Math.max(totalRooms - occupiedRooms, 0);
    const totalStudents = Number(studentTotalRows[0]?.total_students || 0);
    const totalStaff = Number(staffTotalRows[0]?.total_staff || 0);
    const activeAllocations = Number(activeAllocationRows[0]?.active_allocations || 0);

    const selectedHostelSource = hostelId
      ? selectedHostelRows[0]
      : {
          hostel_id: null,
          hostel_name: 'All Hostels',
          total_rooms: totalRooms,
          occupied_rooms: occupiedRooms,
          total_students: totalStudents,
          total_staff: totalStaff,
          active_allocations: activeAllocations,
        };

    const selectedHostel = {
      hostel_id: selectedHostelSource.hostel_id,
      hostel_name: selectedHostelSource.hostel_name,
      total_rooms: Number(selectedHostelSource.total_rooms || 0),
      occupied_rooms: Number(selectedHostelSource.occupied_rooms || 0),
      available_rooms: Math.max(
        Number(selectedHostelSource.total_rooms || 0) -
          Number(selectedHostelSource.occupied_rooms || 0),
        0,
      ),
      total_students: Number(selectedHostelSource.total_students || 0),
      total_staff: Number(selectedHostelSource.total_staff || 0),
      active_allocations: Number(selectedHostelSource.active_allocations || 0),
      monthly_activity: mapMonthlyActivity(activityRows, monthKeys),
    };

    return {
      overview: {
        total_hostels: totalHostels,
        total_rooms: totalRooms,
        occupied_rooms: occupiedRooms,
        available_rooms: availableRooms,
        total_students: totalStudents,
        total_staff: totalStaff,
        active_allocations: activeAllocations,
      },
      month_labels: monthLabels,
      hostels: hostelListRows.map((row) => ({
        hostel_id: Number(row.hostel_id),
        hostel_name: row.hostel_name,
      })),
      selected_hostel: selectedHostel,
      selected_hostel_id: hostelId,
    };
  } catch (error) {
    throw buildDatabaseError(error);
  }
};
