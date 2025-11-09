const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    updateUserProfile, 
    getNote, 
    updateNote 
} = require('../controllers/userController');
const { registerUser, updateUserProfile, getNote, updateNote } = require('../controllers/userController'); // No change needed here, just for context
const { protect } = require('../middleware/authMiddleware');

// Public routes
// Public route for registration
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
// Private routes for user profile and notes
router.route('/profile').put(protect, updateUserProfile);
router.route('/note').get(protect, getNote).put(protect, updateNote);

module.exports = router;//bhanu