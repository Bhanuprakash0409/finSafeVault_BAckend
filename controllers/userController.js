const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('express-async-handler'); // ⬅️ Import asyncHandler

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, minBalance } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password, minBalance });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      minBalance: user.minBalance,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  // Login is by username.
  const { username, password } = req.body;
  const user = await User.findOne({ name: username }).select('+password');

  if (user) {
    if (await user.matchPassword(password)) { // NOSONAR
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        minBalance: user.minBalance,
        token: generateToken(user._id),
      });
    } else {
      console.error('Login failed: Incorrect password for user:', username);
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } else {
    // If user is not found, send a specific error message instead of throwing.
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// @desc    Update user profile (name, minBalance)
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.minBalance = req.body.minBalance !== undefined ? req.body.minBalance : user.minBalance;

    const updatedUser = await user.save();

    // Return updated user data (including the token for context consistency)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      minBalance: updatedUser.minBalance,
      token: generateToken(updatedUser._id), // ⬅️ FIX: Generate a new token
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user's note
// @route   GET /api/users/note
// @access  Private
exports.getNote = asyncHandler(async (req, res) => {
  // The user object is attached to req by the 'protect' middleware
  const user = await User.findById(req.user._id).select('note');
  if (user) {
    res.json({ note: user.note });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user's note
// @route   PUT /api/users/note
// @access  Private
exports.updateNote = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.note = req.body.note || '';
    const updatedUser = await user.save();
    res.json({ note: updatedUser.note });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});