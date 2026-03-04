/**
 * Portal Settings Joi Schemas - copied from be-domain-primetime
 */

const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const portalSchemas = {
  updatePortal: Joi.object({
    domains: Joi.array().items(Joi.string().trim().lowercase()),
    supportMail: Joi.string().email().messages({
      'string.email': 'Support email must be a valid email address.',
    }),

    media: Joi.object({
      companyLogo: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Company logo must be a valid URI',
      }),
      frontPageImage: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Front page image must be a valid URI',
      }),
      favicon: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Favicon must be a valid URI',
      }),
      miniCompanyLogo: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Mini company logo must be a valid URI',
      }),
    }).optional(),
    themeConfiguration: Joi.alternatives()
      .try(
        Joi.object({
          primaryColor: Joi.string().optional(),
          secondaryColor: Joi.string().optional(),
          fontFamily: Joi.string().optional(),
          borderRadius: Joi.string().optional(),
          darkMode: Joi.boolean().optional(),
        }),
        Joi.string().custom((value, helpers) => {
          try {
            return JSON.parse(value);
          } catch {
            return helpers.error('any.invalid');
          }
        })
      )
      .optional()
      .messages({
        'any.invalid': 'Theme configuration must be valid JSON.',
        'object.base': 'Theme configuration must be a valid object.',
      }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field is required for update.',
    }),

  portalId: Joi.object({
    id: Joi.string()
      .custom(objectIdValidation, 'ObjectId Validation')
      .required()
      .messages({
        'string.empty': 'Portal ID is required.',
        'any.invalid': 'Portal ID must be a valid ObjectId.',
        'any.required': 'Portal ID is required.',
      }),
  }),

  deleteMedia: Joi.object({
    fileName: Joi.string()
      .valid('companyLogo', 'favicon', 'frontPageImage', 'miniCompanyLogo')
      .required()
      .messages({
        any: 'fileName must be one of companyLogo, favicon, frontPageImage, miniCompanyLogo',
        'any.required': 'fileName is required',
      }),
  }),

  addMedia: Joi.object({
    fileName: Joi.string()
      .valid('companyLogo', 'favicon', 'frontPageImage', 'miniCompanyLogo')
      .required()
      .messages({
        any: 'fileName must be one of companyLogo, favicon, frontPageImage, miniCompanyLogo',
        'any.required': 'fileName is required',
      }),
    files: Joi.string().uri().allow('', null),
  }),
};

module.exports = portalSchemas;
