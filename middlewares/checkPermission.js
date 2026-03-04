/**
 * Permission check middleware - copied from be-domain-primetime
 */

const Role = require('../models/Role');

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const roleId = user.roleId && user.roleId._id ? user.roleId._id : user.roleId;
      const userRole = await Role.findById(roleId);

      if (!userRole) {
        return res.status(403).json({ error: 'User role not found' });
      }

      if (userRole.type === 'admin') {
        return next();
      }

      const hasPermission = Array.isArray(userRole.permissions) && userRole.permissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

module.exports = { checkPermission };
