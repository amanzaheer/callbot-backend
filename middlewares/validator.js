/**
 * Validation middleware - copied from be-domain-primetime
 */

const validate = (schema, property) => {
  const prop = property || 'body';
  return (req, res, next) => {
    const result = schema.validate(req[prop], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (result.error) {
      const messages = result.error.details.map((d) => d.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: messages,
      });
    }
    next();
  };
};

module.exports = {
  validateBody: (schema) => validate(schema, 'body'),
  validateParams: (schema) => validate(schema, 'params'),
  validateQuery: (schema) => validate(schema, 'query'),
};
