const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcryptjs');

// --------------------------------------------------------
// GET ALL TEACHERS
// --------------------------------------------------------
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

    const offset = (page - 1) * limit;
    query += ' ORDER BY t.teacher_id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [teachers] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM teachers t WHERE 1=1`;
    const countParams = [];

    if (req.user.role === 'Principal' && req.user.schoolId) {
      countQuery += ' AND t.current_school_id = ?';
      countParams.push(req.user.schoolId);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

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

// --------------------------------------------------------
// GET SINGLE TEACHER
// --------------------------------------------------------
exports.getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Teacher can view only their own details
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

// --------------------------------------------------------
// CREATE TEACHER + USER LOGIN
// --------------------------------------------------------
exports.createTeacher = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      nic, first_name, last_name, gender, dob,
      appointment_date, designation, mobile, email,
      appointed_subject_id, current_school_id
    } = req.body;

    // Email required for login
    if (!email) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email is required to create teacher login account'
      });
    }

    const [existingEmail] = await connection.query(
      'SELECT email FROM teachers WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    let work_history = [];
    if (req.body.work_history) {
      try {
        work_history = typeof req.body.work_history === 'string'
          ? JSON.parse(req.body.work_history)
          : req.body.work_history;
      } catch (err) {
        console.error('Error parsing work_history:', err);
      }
    }

    let photo_url = null;
    if (req.files && req.files.photo) {
      try {
        const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
          folder: 'teachers',
          transformation: [{ width: 400, height: 400, crop: 'fill' }]
        });
        photo_url = result.secure_url;
      } catch (uploadError) {
        console.error(uploadError);
      }
    }

    const [roleInfo] = await connection.query(
      "SELECT role_id FROM roles WHERE role_name = 'Teacher'"
    );

    const teacherRoleId = roleInfo[0].role_id;

    const [result] = await connection.query(
      `INSERT INTO teachers 
       (nic, first_name, last_name, gender, dob, appointment_date, 
        designation, mobile, email, appointed_subject_id, current_school_id, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nic, first_name, last_name, gender, dob, appointment_date,
       designation, mobile, email, appointed_subject_id, current_school_id, photo_url]
    );

    const teacherId = result.insertId;

    if (work_history && Array.isArray(work_history)) {
      for (const history of work_history) {
        if (history.from_school_id && history.to_school_id && history.transfer_date) {
          await connection.query(
            `INSERT INTO transfer_history 
             (teacher_id, from_school_id, to_school_id, transfer_date, remarks)
             VALUES (?, ?, ?, ?, ?)`,
            [teacherId, history.from_school_id, history.to_school_id,
             history.transfer_date, history.remarks || null]
          );
        }
      }
    }

    // ---------------------------
    // CREATE USER LOGIN ACCOUNT
    // ---------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nic, salt);

    await connection.query(
      `INSERT INTO users (username, password, role_id, teacher_id)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, teacherRoleId, teacherId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully with login credentials',
      data: {
        teacher_id: teacherId,
        login_credentials: {
          username: email,
          initial_password: 'NIC'   // ✔ No forced password change
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create teacher error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });

  } finally {
    connection.release();
  }
};

// --------------------------------------------------------
// UPDATE TEACHER
// --------------------------------------------------------
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM teachers WHERE teacher_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (req.user.role === 'Principal') {
      if (existing[0].current_school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const {
      first_name, last_name, gender, dob,
      designation, mobile, email, current_school_id
    } = req.body;

    let formattedDob = dob ? new Date(dob).toISOString().split("T")[0] : null;

    let photo_url = existing[0].photo_url;
    if (req.files && req.files.photo) {
      const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
        folder: 'teachers',
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
      });
      photo_url = result.secure_url;
    }

    await pool.query(
      `UPDATE teachers 
       SET first_name=?, last_name=?, gender=?, dob=?, designation=?,
           mobile=?, email=?, current_school_id=?, photo_url=?
       WHERE teacher_id=?`,
      [
        first_name, last_name, gender, formattedDob, designation,
        mobile, email, current_school_id, photo_url, id
      ]
    );

    res.json({ success: true, message: 'Teacher updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --------------------------------------------------------
// DELETE TEACHER + DELETE USER ACCOUNT
// --------------------------------------------------------
exports.deleteTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [teacher] = await connection.query(
      'SELECT * FROM teachers WHERE teacher_id = ?',
      [id]
    );

    if (teacher.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await connection.query(
      'DELETE FROM users WHERE teacher_id = ?',
      [id]
    );

    await connection.query(
      'DELETE FROM teachers WHERE teacher_id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Teacher and associated user account deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });

  } finally {
    connection.release();
  }
};
