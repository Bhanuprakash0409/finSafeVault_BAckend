const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    updateUserProfile, 
    getNote, 
    updateNote 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
router.route('/profile').put(protect, updateUserProfile);
router.route('/note').get(protect, getNote).put(protect, updateNote);

module.exports = router;