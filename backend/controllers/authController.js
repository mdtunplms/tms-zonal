const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Generate JWT Token
const generateToken = (id, role, userId) => {
  return jwt.sign(
    { id, role, userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide username and password' 
      });
    }

    // Get user with role information
    const [users] = await pool.query(
      `SELECT u.*, r.role_name, t.first_name, t.last_name, t.photo_url
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN teachers t ON u.teacher_id = t.teacher_id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user.user_id, user.role_name, user.teacher_id);

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role_name,
        teacherId: user.teacher_id,
        schoolId: user.school_id,
        zoneId: user.zone_id,
        name: user.first_name ? `${user.first_name} ${user.last_name}` : null,
        photo: user.photo_url
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { username, password, role_id, teacher_id, school_id, zone_id } = req.body;

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (username, password, role_id, teacher_id, school_id, zone_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, role_id, teacher_id || null, school_id || null, zone_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.user_id, u.username, r.role_name, u.teacher_id, u.school_id, u.zone_id,
              t.first_name, t.last_name, t.photo_url, s.school_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN teachers t ON u.teacher_id = t.teacher_id
       LEFT JOIN schools s ON u.school_id = s.school_id
       WHERE u.user_id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role_name,
        teacherId: user.teacher_id,
        schoolId: user.school_id,
        zoneId: user.zone_id,
        name: user.first_name ? `${user.first_name} ${user.last_name}` : null,
        photo: user.photo_url,
        schoolName: user.school_name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};