const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate, teacherValidation } = require('../utils/validation');

router.route('/')
  .get(protect, getTeachers)
  .post(protect, authorize('Admin', 'Principal'), validate(teacherValidation), createTeacher);

router.route('/:id')
  .get(protect, getTeacher)
  .put(protect, authorize('Admin', 'Principal'), updateTeacher)
  .delete(protect, authorize('Admin'), deleteTeacher);


router.get('/meta/subjects', protect, async (req, res) => {
  try {
    const [subjects] = await pool.query('SELECT * FROM subjects ORDER BY subject_name');
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;