const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate token for user
const generateUserToken = (user, role = 'user') => {
  const payload = {
    id: user._id,
    email: user.email,
    role: role
  };
  
  return generateToken(payload);
};

// Generate token for provider
const generateProviderToken = (provider) => {
  const payload = {
    id: provider._id,
    email: provider.email,
    role: 'provider',
    isVerified: provider.isVerified
  };
  
  return generateToken(payload);
};

// Generate token for admin
const generateAdminToken = (admin) => {
  const payload = {
    id: admin._id,
    email: admin.email,
    role: admin.role
  };
  
  return generateToken(payload);
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode token without verification (for expired tokens)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const payload = {
    id: userId,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d' // Refresh tokens last longer
  });
};

// Generate password reset token
const generateResetToken = (userId) => {
  const payload = {
    id: userId,
    type: 'reset',
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h' // Reset tokens expire quickly
  });
};

// Generate email verification token
const generateVerificationToken = (userId, email) => {
  const payload = {
    id: userId,
    email: email,
    type: 'verification',
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Verification tokens last 24 hours
  });
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

// Get token expiry time
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  return expiry < new Date();
};

// Get time until token expires
const getTimeUntilExpiry = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  
  return Math.max(0, expiry.getTime() - Date.now());
};

module.exports = {
  generateToken,
  generateUserToken,
  generateProviderToken,
  generateAdminToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  generateResetToken,
  generateVerificationToken,
  extractTokenFromHeader,
  getTokenExpiry,
  isTokenExpired,
  getTimeUntilExpiry
};