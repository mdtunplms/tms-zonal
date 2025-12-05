const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/login', login);
router.post('/register', protect, authorize('Admin'), register);
router.get('/me', protect, getMe);

module.exports = router;