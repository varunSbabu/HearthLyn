const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Provider = require('../models/provider');
const Admin = require('../models/admin');
const { sendResponse } = require('../utils/sendResponse');

// Protect routes middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return sendResponse(res, 401, false, 'Not authorized to access this route');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user based on role
      let user;
      switch (decoded.role) {
        case 'user':
          user = await User.findById(decoded.id);
          break;
        case 'provider':
          user = await Provider.findById(decoded.id);
          break;
        case 'admin':
        case 'super-admin':
        case 'moderator':
          user = await Admin.findById(decoded.id);
          break;
        default:
          return sendResponse(res, 401, false, 'Invalid token role');
      }

      if (!user) {
        return sendResponse(res, 401, false, 'User not found');
      }

      // Check if user is active
      if (!user.isActive) {
        return sendResponse(res, 401, false, 'Account is deactivated');
      }

      // Check if admin account is locked
      if (user.role && user.isLocked) {
        return sendResponse(res, 401, false, 'Account is temporarily locked');
      }

      req.user = user;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      return sendResponse(res, 401, false, 'Invalid token');
    }
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error in authentication');
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return sendResponse(res, 403, false, `Role ${req.userRole} is not authorized to access this route`);
    }
    next();
  };
};

// Check admin permissions
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (req.userRole !== 'admin' && req.userRole !== 'super-admin' && req.userRole !== 'moderator') {
      return sendResponse(res, 403, false, 'Admin access required');
    }

    if (!req.user.hasPermission(module, action)) {
      return sendResponse(res, 403, false, 'Insufficient permissions');
    }

    next();
  };
};

// Optional auth middleware (doesn't require token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        let user;
        switch (decoded.role) {
          case 'user':
            user = await User.findById(decoded.id);
            break;
          case 'provider':
            user = await Provider.findById(decoded.id);
            break;
          case 'admin':
          case 'super-admin':
          case 'moderator':
            user = await Admin.findById(decoded.id);
            break;
        }

        if (user && user.isActive) {
          req.user = user;
          req.userRole = decoded.role;
        }
      } catch (error) {
        // Invalid token, continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return sendResponse(res, 404, false, 'Resource not found');
      }

      // Check ownership based on user role
      let isOwner = false;
      if (req.userRole === 'user' && resource.userId) {
        isOwner = resource.userId.toString() === req.user._id.toString();
      } else if (req.userRole === 'provider' && resource.providerId) {
        isOwner = resource.providerId.toString() === req.user._id.toString();
      } else if (req.userRole === 'user' && resource._id) {
        // For direct user resources (like User model)
        isOwner = resource._id.toString() === req.user._id.toString();
      } else if (req.userRole === 'provider' && resource._id) {
        // For direct provider resources (like Provider model)
        isOwner = resource._id.toString() === req.user._id.toString();
      }

      // Admins can access all resources
      if (req.userRole === 'admin' || req.userRole === 'super-admin') {
        isOwner = true;
      }

      if (!isOwner) {
        return sendResponse(res, 403, false, 'Access denied: You do not own this resource');
      }

      req.resource = resource;
      next();
    } catch (error) {
      return sendResponse(res, 500, false, 'Server error checking ownership');
    }
  };
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would typically use Redis or similar for production
  // For now, we'll use a simple in-memory store
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!req.rateLimitStore) {
    req.rateLimitStore = new Map();
  }

  const key = `${req.ip}-${req.user._id}`;
  const userAttempts = req.rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }

  if (userAttempts.count >= maxAttempts) {
    return sendResponse(res, 429, false, 'Too many sensitive operations. Please try again later.');
  }

  userAttempts.count++;
  req.rateLimitStore.set(key, userAttempts);
  next();
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  optionalAuth,
  checkOwnership,
  sensitiveOperationLimit
};