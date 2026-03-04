/**
 * Permission Model
 * Permission definitions with sub-permissions - copied from be-domain-primetime
 */

const mongoose = require('mongoose');

const subPermissionSchema = new mongoose.Schema({
  permissionName: {
    type: String,
    required: true,
    unique: true,
  },
  permissionKey: {
    type: String,
    unique: true,
  },
  permissionSequence: {
    type: Number,
    default: 0,
  },
});

subPermissionSchema.pre('validate', function (next) {
  if (!this.permissionKey && this.permissionName) {
    this.permissionKey = this.permissionName.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

const permissionSchema = new mongoose.Schema(
  {
    permissionName: {
      type: String,
      required: true,
      unique: true,
    },
    permissionKey: {
      type: String,
      unique: true,
    },
    permissionSequence: {
      type: Number,
      default: 0,
    },
    subPermissions: {
      type: [subPermissionSchema],
      default: [],
    },
  },
  { timestamps: true, collection: 'permissions' }
);

permissionSchema.pre('validate', function (next) {
  if (!this.permissionKey && this.permissionName) {
    this.permissionKey = this.permissionName.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

permissionSchema.pre('save', async function (next) {
  try {
    const existingPermission = await this.constructor.findOne({
      $or: [{ permissionName: this.permissionName }, { permissionKey: this.permissionKey }],
    });

    if (existingPermission) {
      return next(new Error('Permission name or key already exists'));
    }

    const subPermissionKeys = this.subPermissions.map((sub) => sub.permissionKey);
    const duplicateSubPermission = await this.constructor.findOne({
      $or: [
        { permissionKey: { $in: subPermissionKeys } },
        { 'subPermissions.permissionKey': { $in: subPermissionKeys } },
      ],
    });

    if (duplicateSubPermission) {
      return next(new Error('Sub-permission key already exists in the database or matches parent permission key'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Permission', permissionSchema);
