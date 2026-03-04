/**
 * User Auth Middleware
 * Verifies JWT and attaches user with roleId - copied from be-domain-primetime
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'callbot-secret';

const authUserMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const session = await Session.findOne({
      token,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        error: 'Session expired or invalidated. Please login again.',
      });
    }

    const user = await User.findById(decoded.userId)
      .select('-password -pswrd')
      .populate('roleId');

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.isDeleted) {
      return res.status(401).json({ error: 'Account has been deactivated' });
    }

    session.lastActive = new Date();
    await session.save();

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = { authUserMiddleware };
