const express = require('express');
const router = express.Router();
const {
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  getZones
} = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate, schoolValidation } = require('../utils/validation');

router.get('/meta/zones', protect, getZones);

router.route('/')
  .get(protect, getSchools)
  .post(protect, authorize('Admin'), validate(schoolValidation), createSchool);

router.route('/:id')
  .get(protect, getSchool)
  .put(protect, authorize('Admin'), validate(schoolValidation), updateSchool)
  .delete(protect, authorize('Admin'), deleteSchool);

module.exports = router;

