const { body, param, query, validationResult } = require('express-validator');

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  };
};

// Teacher validations
exports.teacherValidation = [
  body('nic').notEmpty().withMessage('NIC is required')
    .isLength({ min: 10, max: 12 }).withMessage('NIC must be 10-12 characters'),
  body('first_name').notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name too long'),
  body('last_name').notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name too long'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('mobile').optional().matches(/^[0-9]{10}$/).withMessage('Mobile must be 10 digits'),
  body('dob').optional().isDate().withMessage('Invalid date of birth'),
  body('appointment_date').notEmpty().withMessage('Appointment date is required')
    .isDate().withMessage('Invalid appointment date'),
  body('appointed_subject_id').notEmpty().withMessage('Subject is required')
    .isInt().withMessage('Invalid subject ID'),
  body('current_school_id').notEmpty().withMessage('Current school is required')
    .isInt().withMessage('Invalid school ID')
];

// School validations
exports.schoolValidation = [
  body('school_code').notEmpty().withMessage('School code is required')
    .isLength({ max: 20 }).withMessage('School code too long'),
  body('school_name').notEmpty().withMessage('School name is required')
    .isLength({ max: 255 }).withMessage('School name too long'),
  body('zone_id').notEmpty().withMessage('Zone is required')
    .isInt().withMessage('Invalid zone ID'),
  body('school_type').notEmpty().withMessage('School type is required')
    .isIn(['Primary', 'Secondary', 'National', 'Provincial'])
    .withMessage('Invalid school type')
];