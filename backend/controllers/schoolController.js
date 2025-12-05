const pool = require('../config/db');

// @desc    Get all schools with filters
// @route   GET /api/schools
// @access  Private
exports.getSchools = async (req, res) => {
  try {
    const { 
      search, 
      school_type, 
      zone_id, 
      district_id,
      page = 1, 
      limit = 10 
    } = req.query;

    let query = `
      SELECT s.*, 
             z.zone_name,
             d.district_name,
             COUNT(DISTINCT t.teacher_id) as teacher_count
      FROM schools s
      JOIN zones z ON s.zone_id = z.zone_id
      JOIN districts d ON z.district_id = d.district_id
      LEFT JOIN teachers t ON s.school_id = t.current_school_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (s.school_name LIKE ? OR s.school_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (school_type) {
      query += ' AND s.school_type = ?';
      params.push(school_type);
    }

    if (zone_id) {
      query += ' AND s.zone_id = ?';
      params.push(zone_id);
    }

    if (district_id) {
      query += ' AND z.district_id = ?';
      params.push(district_id);
    }

    query += ' GROUP BY s.school_id ORDER BY s.school_name';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [schools] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT s.school_id) as total FROM schools s
                      JOIN zones z ON s.zone_id = z.zone_id
                      WHERE 1=1`;
    const countParams = [];

    if (school_type) {
      countQuery += ' AND s.school_type = ?';
      countParams.push(school_type);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Private
exports.getSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const [schools] = await pool.query(
      `SELECT s.*, 
              z.zone_name,
              d.district_name,
              COUNT(DISTINCT t.teacher_id) as teacher_count
       FROM schools s
       JOIN zones z ON s.zone_id = z.zone_id
       JOIN districts d ON z.district_id = d.district_id
       LEFT JOIN teachers t ON s.school_id = t.current_school_id
       WHERE s.school_id = ?
       GROUP BY s.school_id`,
      [id]
    );

    if (schools.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'School not found' 
      });
    }

    res.json({
      success: true,
      data: schools[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new school
// @route   POST /api/schools
// @access  Private/Admin
exports.createSchool = async (req, res) => {
  try {
    const { school_code, school_name, zone_id, address, school_type } = req.body;

    const [result] = await pool.query(
      `INSERT INTO schools (school_code, school_name, zone_id, address, school_type)
       VALUES (?, ?, ?, ?, ?)`,
      [school_code, school_name, zone_id, address, school_type]
    );

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: { school_id: result.insertId }
    });

  } catch (error) {
    console.error(error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: 'School code already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private/Admin
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_code, school_name, zone_id, address, school_type } = req.body;

    const [result] = await pool.query(
      `UPDATE schools 
       SET school_code = ?, school_name = ?, zone_id = ?, 
           address = ?, school_type = ?
       WHERE school_id = ?`,
      [school_code, school_name, zone_id, address, school_type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'School not found' 
      });
    }

    res.json({
      success: true,
      message: 'School updated successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if school has teachers
    const [teachers] = await pool.query(
      'SELECT COUNT(*) as count FROM teachers WHERE current_school_id = ?',
      [id]
    );

    if (teachers[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete school with assigned teachers' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM schools WHERE school_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'School not found' 
      });
    }

    res.json({
      success: true,
      message: 'School deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get zones and districts
// @route   GET /api/schools/meta/zones
// @access  Private
exports.getZones = async (req, res) => {
  try {
    const [zones] = await pool.query(
      `SELECT z.*, d.district_name 
       FROM zones z
       JOIN districts d ON z.district_id = d.district_id
       ORDER BY d.district_name, z.zone_name`
    );

    const [districts] = await pool.query(
      'SELECT * FROM districts ORDER BY district_name'
    );

    res.json({
      success: true,
      data: {
        zones,
        districts
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
