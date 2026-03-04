/**
 * Permission Joi Schemas - copied from be-domain-primetime
 */

const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const subPermissionSchema = Joi.object({
  permissionName: Joi.string().required().messages({
    'string.empty': 'Sub-permission name is required.',
    'any.required': 'Sub-permission name is required.',
  }),
  permissionKey: Joi.string().optional(),
  permissionSequence: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Permission sequence must be a number.',
    'number.integer': 'Permission sequence must be an integer.',
    'number.min': 'Permission sequence must be at least 0.',
  }),
});

const permissionSchemas = {
  permissionId: Joi.object({
    permissionId: Joi.string()
      .custom(objectIdValidation, 'ObjectId Validation')
      .required()
      .messages({
        'string.empty': 'Permission ID is required.',
        'any.invalid': 'Permission ID must be a valid ObjectId.',
      }),
  }),

  createPermission: Joi.object({
    permissionName: Joi.string().required().messages({
      'string.empty': 'Permission name is required.',
      'any.required': 'Permission name is required.',
    }),
    permissionKey: Joi.string().optional(),
    permissionSequence: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Permission sequence must be a number.',
      'number.integer': 'Permission sequence must be an integer.',
      'number.min': 'Permission sequence must be at least 0.',
    }),
    subPermissions: Joi.array().items(subPermissionSchema).default([]),
  }),

  updatePermission: Joi.object({
    permissionName: Joi.string().optional().messages({
      'string.empty': 'Permission name cannot be empty if provided.',
    }),
    permissionSequence: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Permission sequence must be a number.',
      'number.integer': 'Permission sequence must be an integer.',
      'number.min': 'Permission sequence must be at least 0.',
    }),
    subPermissions: Joi.array().items(subPermissionSchema).optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field is required for update.',
    }),

  addSubPermission: Joi.object({
    subPermission: subPermissionSchema.required().messages({
      'any.required': 'Sub-permission details are required.',
    }),
  }),

  removeSubPermission: Joi.object({
    permissionId: Joi.string()
      .custom(objectIdValidation, 'ObjectId Validation')
      .required()
      .messages({
        'string.empty': 'Permission ID is required.',
        'any.invalid': 'Permission ID must be a valid ObjectId.',
      }),
    subPermissionKey: Joi.string().required().messages({
      'string.empty': 'Sub-permission key is required.',
      'any.required': 'Sub-permission key is required.',
    }),
  }),
};

module.exports = permissionSchemas;
