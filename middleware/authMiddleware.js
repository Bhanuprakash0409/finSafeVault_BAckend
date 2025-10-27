const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in standard Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. ⬅️ NEW: Check for token in query string (for direct downloads like CSV)
  else if (req.query.token) {
      token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token (uses the token found above)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user object (excluding password) to the request
    const user = await User.findById(decoded.id).select('-password');
    
    // ✅ CRITICAL FIX: Manually attach the verified token to the request object
    user.token = token;
    req.user = user;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };