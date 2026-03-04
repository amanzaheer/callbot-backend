/**
 * Auth Joi Schemas - copied from be-domain-primetime
 */

const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/])[A-Za-z\d!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]{8,}$/;

const authSchemas = {
  login: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
  }),

  register: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required',
    }),
    personalInfo: Joi.object({
      firstName: Joi.string().trim().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
      }),
      lastName: Joi.string().trim().allow('', null),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).messages({
        'string.pattern.base': 'Mobile number must be 10 digits',
      }),
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).pattern(passwordPattern).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, special char',
      'any.required': 'Password is required',
    }),
    businessId: Joi.string().custom(objectIdValidation).optional().allow(null),
    roleId: Joi.string().custom(objectIdValidation).optional(),
  }),

  recoverPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
      'any.required': 'Email is required',
    }),
  }),

  resetPassword: Joi.object({
    password: Joi.string().min(8).pattern(passwordPattern).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required',
    }),
  }),

  signup: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
      'any.required': 'Email is required',
    }),
    username: Joi.string().required().messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required',
    }),
    personalInfo: Joi.object({
      firstName: Joi.string().trim().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
      }),
      lastName: Joi.string().trim().allow('', null),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).messages({
        'string.pattern.base': 'Mobile number must be 10 digits',
      }),
    }).required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),
};

module.exports = authSchemas;
