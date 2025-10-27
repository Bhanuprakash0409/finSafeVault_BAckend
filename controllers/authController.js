const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // ⬅️ CRITICAL: ENSURE THIS IS PRESENT
const { sendWelcomeEmail, sendNameChangeConfirmation } = require('../services/emailService');
const asyncHandler = require('express-async-handler');

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, minBalance } = req.body; 

  if (!name || !email || !password) { // Ensure required fields are present
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

    try {
    // Check for existing user (name or email)
    let userByName = await User.findOne({ name });
    let userByEmail = await User.findOne({ email });
    if (userByName || userByEmail) {
      return res.status(400).json({ message: 'Username or email already exists' });
        }

    // Create the new user with the plain-text password.
    // The hashing will be handled by the pre-save middleware in the User model.
    const user = new User({ 
        name, 
        email, 
        password: password,
        minBalance: minBalance !== undefined ? Number(minBalance) : 0 
    }); 

    await user.save();

    // Send a welcome email to the new user
    await sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      minBalance: user.minBalance,
      token: generateToken(user._id),
    });
    } catch (error) {
    console.error("Registration Crash Error:", error); // <-- Check this log!
    res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { name, password } = req.body; 

  try {
    // 1. Find user and explicitly retrieve the hashed password
    const user = await User.findOne({ name }).select('+password'); 

    // 2. CRITICAL CHECK: Crash Guard
    // If user is NOT found OR if the retrieved user object is missing the password hash (corrupt data), reject the login.
    if (!user || !user.password) { 
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 3. Safely compare passwords
    if (await user.matchPassword(password)) {
      
      // Remove the hash before sending the object back
      user.password = undefined; 

      // Login successful!
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        minBalance: user.minBalance 
      });
    } else {
      // Passwords didn't match
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error("Login Crash Error:", error); // <-- Check this log if it still crashes!
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Update minimum balance
// @route   PUT /api/auth/settings/min-balance
// @access  Private
// @desc Update ONLY minimum balance (The only setting left)
// @route PUT /api/auth/settings/min-balance
// @access Private
exports.updateMinBalance = async (req, res) => {
    const { minBalance } = req.body;
    
    try {
        const user = await User.findById(req.user._id).select('+email'); // Still need email for balance alerts
        
        if (!user) {
            res.status(404).json({ message: 'User not found' });
        }
        
        user.minBalance = Number(minBalance);

        await user.save();
        
        // ⬅️ FIX: Return all user data needed by the frontend to update context
        res.json({
            message: 'Minimum balance updated.',
            _id: user._id,
            name: user.name, // Used for Navbar display
            email: user.email,
            minBalance: user.minBalance // CRITICAL: The new value
        });

    } catch (error) {
        console.error('Error updating minimum balance:', error);
        res.status(500).json({ message: 'Failed to update minimum balance.' });
    }
};