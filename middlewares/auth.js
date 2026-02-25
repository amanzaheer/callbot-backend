/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const Business = require('../models/Business');

/**
 * Verify JWT token and attach business to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach business info to request
    const business = await Business.findById(decoded.businessId);
    if (!business) {
      return res.status(401).json({
        success: false,
        message: 'Business not found'
      });
    }

    req.business = business;
    req.businessId = decoded.businessId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const business = await Business.findById(decoded.businessId);
      if (business) {
        req.business = business;
        req.businessId = decoded.businessId;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = { authenticate, optionalAuth };

