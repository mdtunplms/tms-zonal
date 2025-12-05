const pool = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'Admin') {
      // Total counts
      const [teacherCount] = await pool.query('SELECT COUNT(*) as count FROM teachers');
      const [schoolCount] = await pool.query('SELECT COUNT(*) as count FROM schools');
      const [districtCount] = await pool.query('SELECT COUNT(*) as count FROM districts');
      const [zoneCount] = await pool.query('SELECT COUNT(*) as count FROM zones');

      // Teachers by school type
      const [teachersByType] = await pool.query(`
        SELECT s.school_type, COUNT(t.teacher_id) as count
        FROM schools s
        LEFT JOIN teachers t ON s.school_id = t.current_school_id
        GROUP BY s.school_type
      `);

      // Recent transfers
      const [recentTransfers] = await pool.query(`
        SELECT th.*, 
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
               fs.school_name as from_school,
               ts.school_name as to_school
        FROM transfer_history th
        JOIN teachers t ON th.teacher_id = t.teacher_id
        JOIN schools fs ON th.from_school_id = fs.school_id
        JOIN schools ts ON th.to_school_id = ts.school_id
        ORDER BY th.transfer_date DESC
        LIMIT 5
      `);

      stats = {
        totalTeachers: teacherCount[0].count,
        totalSchools: schoolCount[0].count,
        totalDistricts: districtCount[0].count,
        totalZones: zoneCount[0].count,
        teachersByType,
        recentTransfers
      };

    } else if (req.user.role === 'Principal') {
      // School specific stats
      const [teacherCount] = await pool.query(
        'SELECT COUNT(*) as count FROM teachers WHERE current_school_id = ?',
        [req.user.schoolId]
      );

      const [teachersBySubject] = await pool.query(`
        SELECT sub.subject_name, COUNT(t.teacher_id) as count
        FROM subjects sub
        LEFT JOIN teachers t ON sub.subject_id = t.appointed_subject_id
        WHERE t.current_school_id = ?
        GROUP BY sub.subject_id
      `, [req.user.schoolId]);

      stats = {
        totalTeachers: teacherCount[0].count,
        teachersBySubject
      };

    } else if (req.user.role === 'Teacher') {
      // Teacher's own stats
      const [teacher] = await pool.query(`
        SELECT t.*,
               s.school_name,
               sub.subject_name,
               TIMESTAMPDIFF(YEAR, t.appointment_date, CURDATE()) as years_of_service
        FROM teachers t
        JOIN schools s ON t.current_school_id = s.school_id
        JOIN subjects sub ON t.appointed_subject_id = sub.subject_id
        WHERE t.teacher_id = ?
      `, [req.user.userId]);

      stats = {
        profile: teacher[0]
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};