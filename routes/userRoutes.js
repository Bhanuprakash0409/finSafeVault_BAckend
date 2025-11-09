const express = require('express');
const router = express.Router();
const { 
    updateUserProfile, 
    getNote, 
    updateNote 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Private routes for user profile and notes
router.route('/profile').put(protect, updateUserProfile);
router.route('/note').get(protect, getNote).put(protect, updateNote);

module.exports = router;