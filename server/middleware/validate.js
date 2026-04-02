const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results
 * and returns 400 with errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Sanitize request body: remove __proto__ and constructor keys
 * to prevent prototype pollution attacks.
 */
const sanitizeBody = (req, _res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      delete obj.__proto__;
      delete obj.constructor;
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  next();
};

module.exports = { validate, sanitizeBody };
