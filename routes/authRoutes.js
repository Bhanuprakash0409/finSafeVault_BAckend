const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateMinBalance } = require('../controllers/authController'); 
const { protect } = require('../middleware/authMiddleware'); 

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);
 
// ⬅️ KEEP ONLY THIS ROUTE
router.put('/settings/min-balance', protect, updateMinBalance);

module.exports = router;