const { validationResult, body, param, query } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  };
};

// Auth validation rules
const signupValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('matric_number')
    .trim()
    .notEmpty()
    .withMessage('Matric number is required')
    .matches(/^[A-Z]{3}\/[0-9]{4}\/[0-9]{3}$/)
    .withMessage('Invalid matric number format'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(value => {
      if (!value.endsWith('@fuoye.edu.ng')) {
        throw new Error('Email must be a FUOYE email address');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

const loginValidation = [
  body('matric_number').trim().notEmpty().withMessage('Matric number is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

// Payment validation rules
const initializePaymentValidation = [
  body('fee_ids')
    .isArray()
    .withMessage('Fee IDs must be an array')
    .notEmpty()
    .withMessage('At least one fee must be selected')
];

const verifyPaymentValidation = [
  param('reference')
    .notEmpty()
    .withMessage('Payment reference is required')
];

// Fee validation rules
const createFeeValidation = [
  body('name').trim().notEmpty().withMessage('Fee name is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('category_type')
    .isIn(['dues', 'manual', 'excursion', 'other'])
    .withMessage('Invalid category type'),
  body('department').optional().trim(),
  body('level').optional().trim(),
  body('is_mandatory').optional().isBoolean(),
  body('academic_session').optional().trim(),
  body('due_date').optional().isISO8601().toDate()
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  initializePaymentValidation,
  verifyPaymentValidation,
  createFeeValidation
};