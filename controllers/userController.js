/**
 * User Controller
 * User CRUD - copied from be-domain-primetime
 */

const User = require('../models/User');
const Role = require('../models/Role');
const { generateFilterQuery } = require('../utils/generateFilterQuery');
const logger = require('../utils/logger');

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRole = await Role.findById(req.user.roleId);
    const isAdmin = userRole && userRole.type === 'admin';

    const currentUserId = req.user._id ? req.user._id.toString() : req.user.userId?.toString();
    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only update your own profile.',
      });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (req.body.personalInfo) updateData.personalInfo = req.body.personalInfo;
    if (req.body.allowedIps) updateData.allowedIps = req.body.allowedIps;
    if (isAdmin) {
      if (req.body.roleId) updateData.roleId = req.body.roleId;
      if (req.body.businessId !== undefined) updateData.businessId = req.body.businessId;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRole = await Role.findById(req.user.roleId);
    if (!userRole || userRole.type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required to delete users.',
      });
    }

    const currentUserId = req.user._id ? req.user._id.toString() : req.user.userId?.toString();
    if (currentUserId === userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndUpdate(userId, { isDeleted: true });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const userRole = await Role.findById(req.user.roleId);
    if (!userRole || userRole.type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required to view all users.',
      });
    }

    const { filters = {}, sort = { createdAt: -1 }, limit = 10, page = 1 } = req.body;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const filterQuery = generateFilterQuery(filters);
    const baseCriteria = { isDeleted: false };
    const combinedQuery = { ...baseCriteria, ...filterQuery };

    const totalCount = await User.countDocuments(combinedQuery);
    const users = await User.find(combinedQuery)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('roleId', 'name type permissions');

    return res.status(200).json({
      success: true,
      data: {
        users,
        totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRole = await Role.findById(req.user.roleId);
    const isAdmin = userRole && userRole.type === 'admin';

    const currentUserId = req.user._id ? req.user._id.toString() : req.user.userId?.toString();
    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only view your own profile.',
      });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error('Get user by id error:', error);
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const userRole = await Role.findById(req.user.roleId);
    const roleIdFromUser = req.user.roleId && req.user.roleId._id ? req.user.roleId._id : req.user.roleId;
    const adminRole = await Role.findById(roleIdFromUser);
    if (!adminRole || adminRole.type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required to assign roles.',
      });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { roleId }, { new: true });

    return res.status(200).json({
      message: 'Role assigned successfully',
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.personalInfo?.firstName,
        lastName: updatedUser.personalInfo?.lastName,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
      },
    });
  } catch (error) {
    logger.error('Assign role error:', error);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { new_password } = req.body;

    const userRole = await Role.findById(req.user.roleId);
    const isAdmin = userRole && userRole.type === 'admin';

    const currentUserId = req.user._id ? req.user._id.toString() : req.user.userId?.toString();
    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only change your own password.',
      });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password +pswrd');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = new_password;
    user.pswrd = new_password;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword, currentPassword } = req.body;
    const userId = req.user._id || req.user.userId;

    const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password +pswrd');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New password and confirm password do not match',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'Current password and new password should not be the same',
      });
    }

    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    user.password = newPassword;
    user.pswrd = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change my password error:', error);
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.userId;
    const { personalInfo } = req.body;

    if (!personalInfo || !personalInfo.firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false }).populate('roleId', 'type level name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (personalInfo) {
      user.personalInfo = personalInfo;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update my profile error:', error);
    next(error);
  }
};

const userSettings = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.userId;
    const { settings } = req.body;

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (settings && typeof settings === 'object') {
      user.settings = user.settings || {};
      Object.keys(settings).forEach((key) => {
        user.settings[key] = settings[key];
      });
    }

    const updatedUser = await user.save();
    return res.status(200).json({ settngs: updatedUser.settings });
  } catch (error) {
    logger.error('User settings error:', error);
    next(error);
  }
};

module.exports = {
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  assignRole,
  changePassword,
  changeMyPassword,
  updateMyProfile,
  userSettings,
};
