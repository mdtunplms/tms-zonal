const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');

// @desc    Get all teachers with filters
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = async (req, res) => {
  try {
    const { 
      search, 
      school_id, 
      min_years, 
      subject_id, 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = `
      SELECT t.*, 
             s.school_name as current_school_name,
             s.school_code,
             sub.subject_name,
             z.zone_name,
             d.district_name,
             TIMESTAMPDIFF(YEAR, t.appointment_date, CURDATE()) as total_years,
             TIMESTAMPDIFF(YEAR, 
               COALESCE(
                 (SELECT MAX(transfer_date) FROM transfer_history WHERE teacher_id = t.teacher_id AND to_school_id = t.current_school_id),
                 t.appointment_date
               ),
               CURDATE()
             ) as years_in_current_school
      FROM teachers t
      JOIN schools s ON t.current_school_id = s.school_id
      JOIN subjects sub ON t.appointed_subject_id = sub.subject_id
      JOIN zones z ON s.zone_id = z.zone_id
      JOIN districts d ON z.district_id = d.district_id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters based on user role
    if (req.user.role === 'Principal' && req.user.schoolId) {
      query += ' AND t.current_school_id = ?';
      params.push(req.user.schoolId);
    }

    if (search) {
      query += ` AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.nic LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (school_id) {
      query += ' AND t.current_school_id = ?';
      params.push(school_id);
    }

    if (subject_id) {
      query += ' AND t.appointed_subject_id = ?';
      params.push(subject_id);
    }

    // Calculate offset
    const offset = (page - 1) * limit;
    query += ' ORDER BY t.teacher_id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [teachers] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM teachers t WHERE 1=1`;
    const countParams = [];

    if (req.user.role === 'Principal' && req.user.schoolId) {
      countQuery += ' AND t.current_school_id = ?';
      countParams.push(req.user.schoolId);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Filter by years in current school (after query)
    let filteredTeachers = teachers;
    if (min_years) {
      filteredTeachers = teachers.filter(t => t.years_in_current_school >= parseInt(min_years));
    }

    res.json({
      success: true,
      data: filteredTeachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role === 'Teacher' && req.user.userId !== parseInt(id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this teacher' 
      });
    }

    const [teachers] = await pool.query(
      `SELECT t.*, 
              s.school_name as current_school_name,
              s.school_code,
              sub.subject_name,
              z.zone_name,
              d.district_name,
              TIMESTAMPDIFF(YEAR, t.appointment_date, CURDATE()) as total_years
       FROM teachers t
       JOIN schools s ON t.current_school_id = s.school_id
       JOIN subjects sub ON t.appointed_subject_id = sub.subject_id
       JOIN zones z ON s.zone_id = z.zone_id
       JOIN districts d ON z.district_id = d.district_id
       WHERE t.teacher_id = ?`,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Teacher not found' 
      });
    }

    // Get work history
    const [workHistory] = await pool.query(
      `SELECT 
              th.transfer_id,
              th.transfer_date,
              th.remarks,
              fs.school_name as from_school,
              ts.school_name as to_school
       FROM transfer_history th
       JOIN schools fs ON th.from_school_id = fs.school_id
       JOIN schools ts ON th.to_school_id = ts.school_id
       WHERE th.teacher_id = ?
       ORDER BY th.transfer_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...teachers[0],
        work_history: workHistory
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private/Admin
exports.createTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      nic, first_name, last_name, gender, dob,
      appointment_date, designation, mobile, email,
      appointed_subject_id, current_school_id
    } = req.body;

    let work_history = [];
if (req.body.work_history) {
  try {
    work_history = typeof req.body.work_history === 'string' 
      ? JSON.parse(req.body.work_history) 
      : req.body.work_history;
  } catch (error) {
    console.error('Error parsing work_history:', error);
  }
}

    let photo_url = null;

    // Upload photo to Cloudinary if provided
    if (req.files && req.files.photo) {
      const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
        folder: 'teachers',
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
      });
      photo_url = result.secure_url;
    }

    // Insert teacher
    const [result] = await connection.query(
      `INSERT INTO teachers 
       (nic, first_name, last_name, gender, dob, appointment_date, 
        designation, mobile, email, appointed_subject_id, current_school_id, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nic, first_name, last_name, gender, dob, appointment_date,
       designation, mobile, email, appointed_subject_id, current_school_id, photo_url]
    );

    const teacherId = result.insertId;

    // Insert work history if provided
    if (work_history && Array.isArray(work_history)) {
      for (const history of work_history) {
        await connection.query(
          `INSERT INTO transfer_history 
           (teacher_id, from_school_id, to_school_id, transfer_date, remarks)
           VALUES (?, ?, ?, ?, ?)`,
          [teacherId, history.from_school_id, history.to_school_id, 
           history.transfer_date, history.remarks || null]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: { teacher_id: teacherId }
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: 'NIC already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private/Admin/Principal
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if teacher exists
    const [existing] = await pool.query(
      'SELECT * FROM teachers WHERE teacher_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check permissions for principal
    if (req.user.role === 'Principal') {
      if (existing[0].current_school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this teacher'
        });
      }
    }

    const {
      first_name, last_name, gender, dob,
      designation, mobile, email, current_school_id
    } = req.body;

    // -------------------------------
    // FIX: Convert dob to YYYY-MM-DD
    // -------------------------------
    let formattedDob = null;

    if (dob) {
      try {
        formattedDob = new Date(dob).toISOString().split("T")[0]; 
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid date format for dob"
        });
      }
    }
    // -------------------------------

    let photo_url = existing[0].photo_url;

    // Upload new photo if provided
    if (req.files && req.files.photo) {
      const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
        folder: 'teachers',
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
      });
      photo_url = result.secure_url;
    }

    // Update teacher
    await pool.query(
      `UPDATE teachers 
       SET first_name = ?, last_name = ?, gender = ?, dob = ?,
           designation = ?, mobile = ?, email = ?, 
           current_school_id = ?, photo_url = ?
       WHERE teacher_id = ?`,
      [
        first_name,
        last_name,
        gender,
        formattedDob,   // USE FIXED DOB
        designation,
        mobile,
        email,
        current_school_id,
        photo_url,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Teacher updated successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM teachers WHERE teacher_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Teacher not found' 
      });
    }

    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};