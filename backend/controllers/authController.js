const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Generate JWT Token
const generateToken = (id, role, userId, schoolId) => {
  return jwt.sign(
    { id, role, userId, schoolId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// ------------------------------------------------------
// LOGIN USER (Admin, Principal, Teacher)
// ------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Fetch user with role + teacher info
    const [users] = await pool.query(
      `SELECT 
          u.*, 
          r.role_name,
          t.first_name, 
          t.last_name, 
          t.photo_url, 
          t.email, 
          t.nic
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

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // FIRST LOGIN CHECK — password still equals NIC
    let isFirstLogin = false;
    if (user.nic) {
      isFirstLogin = await bcrypt.compare(user.nic, user.password);
    }

    // Generate token
    const token = generateToken(
      user.user_id,
      user.role_name,
      user.teacher_id,
      user.school_id
    );

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
        photo: user.photo_url,
        email: user.email,
        isFirstLogin
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

// ------------------------------------------------------
// CHANGE PASSWORD (Users including Teachers)
// ------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
