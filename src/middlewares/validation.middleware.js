/**
 * Custom validation middleware for Joi v17+
 * Compatible with current validation schemas
 */

export default function validate(schema) {
  return async (req, res, next) => {
    try {
      // Build validation object from schema
      const validationRules = {
        body: schema.body,
        params: schema.params,
        query: schema.query,
        headers: schema.headers,
      };

      const toValidate = {
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
      };

      // Perform validation for each part
      for (const [key, rule] of Object.entries(validationRules)) {
        if (rule) {
          const { error, value } = rule.validate(toValidate[key], {
            abortEarly: false,
            stripUnknown: true,
          });

          if (error) {
            const messages = error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));

            return res.status(400).json({
              status: 'error',
              message: 'Validation failed',
              errors: messages,
            });
          }

          // Update request with validated value
          if (key === 'body') req.body = value;
          else if (key === 'params') req.params = value;
          else if (key === 'query') req.query = value;
          else if (key === 'headers') req.headers = value;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
