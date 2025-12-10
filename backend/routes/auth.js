// const express = require('express');
// const router = express.Router();
// const { login, register, getMe, changePassword } = require('../controllers/authController');
// const { protect } = require('../middleware/auth');
// const { authorize } = require('../middleware/roleCheck');

// router.post('/login', login);
// router.post('/register', protect, authorize('Admin'), register);
// router.get('/me', protect, getMe);
// router.put('/change-password', protect, changePassword);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Login
router.post('/login', login);

// Change password
router.put('/change-password', protect, changePassword);

// Current user (if you want this)
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;
