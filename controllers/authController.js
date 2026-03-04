/**
 * Auth Controller
 * Login, logout, register, refreshToken - copied from be-domain-primetime
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Role = require('../models/Role');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'callbot-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';

const generateAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      roleId: user.roleId?._id || user.roleId,
      businessId: user.businessId || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  const roleId = user.roleId && user.roleId._id ? user.roleId._id : user.roleId;
  return jwt.sign(
    {
      userId: user._id,
      roleId: roleId || null,
      businessId: user.businessId || null,
    },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
};

const handleDuplicateError = (error) => {
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern)[0];
    return {
      [duplicateField]: `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists.`,
    };
  }
  return error.message || error;
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, isDeleted: false })
      .select('+password +pswrd')
      .populate('roleId');

    if (!user) {
      return res.status(400).json({ error: 'Invalid User credential.' });
    }

    if (user.isDeleted) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Password credential.' });
    }

    const accessToken = generateAuthToken(user);
    const refreshToken = generateRefreshToken(user);

    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'Unknown IP';

    const session = new Session({
      userId: user._id,
      token: accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      isActive: true,
      lastActive: new Date(),
      businessId: user.businessId,
    });

    await session.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.pswrd;

    return res.json({
      message: 'User Logged in successfully',
      data: {
        ...userResponse,
        accessToken,
        refreshToken,
        sessionInfo: {
          deviceInfo,
          ipAddress,
          loginTime: new Date(),
        },
      },
    });
  } catch (error) {
    logger.error('Auth login error:', error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const session = await Session.findOneAndUpdate(
      { token, isActive: true },
      { isActive: false, lastActive: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found or already logged out' });
    }

    return res.json({ message: 'User logged out successfully' });
  } catch (error) {
    logger.error('Auth logout error:', error);
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
      isDeleted: false,
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.username === req.body.username ? 'Username already exists.' : 'Email already exists.',
      });
    }

    let roleExists;
    if (req.body.roleId) {
      roleExists = await Role.findById(req.body.roleId);
      if (!roleExists) {
        return res.status(400).json({ error: 'Specified role does not exist.' });
      }
    } else {
      const defaultRole = await Role.findOne({ type: 'user' }).sort({ level: -1 }).limit(1);
      if (!defaultRole) {
        return res.status(500).json({ error: 'No default user role found in the system.' });
      }
      req.body.roleId = defaultRole._id;
    }

    const userData = {
      username: req.body.username,
      personalInfo: req.body.personalInfo,
      email: req.body.email,
      password: req.body.password,
      pswrd: req.body.password,
      businessId: req.body.businessId,
      roleId: req.body.roleId,
      createdBy: req.user?.userId,
    };

    const user = await User.create(userData);

    const savedUserResponse = user.toObject();
    delete savedUserResponse.password;
    delete savedUserResponse.pswrd;

    return res.status(201).json({
      message: 'User registered successfully',
      data: savedUserResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: handleDuplicateError(error) });
    }
    logger.error('Auth register error:', error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: refreshTokenBody } = req.body;

    if (!refreshTokenBody) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenBody, JWT_SECRET);
    } catch (_err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const session = await Session.findOne({
      userId: decoded.userId,
      refreshToken: refreshTokenBody,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAccessToken = generateAuthToken(user);

    session.token = newAccessToken;
    session.lastActive = new Date();
    await session.save();

    return res.json({
      message: 'Access token refreshed successfully',
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    logger.error('Auth refreshToken error:', error);
    next(error);
  }
};

const signup = async (req, res, next) => {
  try {
    const { email, personalInfo, username } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      isDeleted: false,
    });

    if (existingUser && existingUser.email === email) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    if (existingUser && existingUser.username === username) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const password = crypto.randomBytes(8).toString('hex');

    const userData = {
      email,
      username,
      personalInfo,
      password,
      pswrd: password,
      verificationToken,
    };

    await User.create(userData);

    return res.status(201).json({
      message:
        'Account created successfully. Please wait for admin verification. Once admin verifies your account, you will receive an email with your credentials.',
    });
  } catch (error) {
    logger.error('Auth signup error:', error);
    next(error);
  }
};

module.exports = {
  login,
  logout,
  register,
  refreshToken,
  signup,
};
