/**
 * Role Joi Schemas - copied from be-domain-primetime
 */

const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const roleSchemas = {
  addRole: Joi.object({
    name: Joi.string().trim().required(),
    level: Joi.number().integer().min(1).required(),
    type: Joi.string().trim().valid('admin', 'user', 'developer').default('user'),
    permissions: Joi.array().items(Joi.string().trim()).allow(null),
  }),

  updateRole: Joi.object({
    name: Joi.string().trim(),
    level: Joi.number().integer().min(1),
    permissions: Joi.array().items(Joi.string().trim()).allow(null),
  }).min(1),

  roleId: Joi.object({
    roleId: Joi.string().trim().custom(objectIdValidation, 'ObjectId Validation').required(),
  }),

  updatePermissions: Joi.object({
    permissions: Joi.array().items(Joi.string().trim()).allow(null).default([]),
  }),
};

module.exports = roleSchemas;
