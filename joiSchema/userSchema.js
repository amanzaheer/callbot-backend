/**
 * User Joi Schemas - copied from be-domain-primetime
 */

const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const passwordPattern = new RegExp(
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|:;\"'<>,.?/])[A-Za-z\\d!@#$%^&*()_+\\-={}\\[\\]|:;\"'<>,.?/]{8,}$"
);

const userSchemas = {
  userId: Joi.object({
    userId: Joi.string().custom(objectIdValidation).required().messages({
      'string.empty': 'User ID is required.',
      'any.invalid': 'User ID must be a valid ObjectId.',
    }),
  }),

  updateUser: Joi.object({
    username: Joi.string().trim().lowercase(),
    email: Joi.string().email(),
    personalInfo: Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      mobile: Joi.string().allow('', null),
    }),
    businessId: Joi.string().custom(objectIdValidation).allow(null),
    allowedIps: Joi.array().items(Joi.string().ip()),
  }).min(1),

  assignRole: Joi.object({
    roleId: Joi.string().custom(objectIdValidation).required().messages({
      'string.empty': 'Role ID is required.',
      'any.invalid': 'Role ID must be a valid ObjectId.',
    }),
  }),

  changePasswordSchema: Joi.object({
    new_password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long.',
        'string.pattern.base':
          'Password must contain at least one uppercase, one lowercase, one number, and one special character.',
        'any.required': 'New password is required.',
      }),
    currentPassword: Joi.string().min(8).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().min(8).optional(),
    newPassword: Joi.string().min(8).pattern(passwordPattern).required().messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base':
        'New password must contain at least one uppercase, one lowercase, one number, and one special character',
      'any.required': 'New password is required',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required',
    }),
  }),

  updateProfile: Joi.object({
    personalInfo: Joi.object({
      firstName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
      }),
      lastName: Joi.string().trim().allow('', null),
      mobile: Joi.string().trim().allow('', null),
    }),
  }),

  updateSettings: Joi.object({
    settings: Joi.object({
      timeZone: Joi.string().optional(),
    })
      .min(1)
      .required()
      .messages({
        'object.min': 'At least one setting must be provided',
      }),
  }),
};

module.exports = userSchemas;
