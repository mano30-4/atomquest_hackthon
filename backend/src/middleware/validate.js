const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new ApiError(400, 'Validation Error', true, JSON.stringify(errors));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // ID parameter
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    employeeId: Joi.string().allow('', null),
    department: Joi.string().allow('', null),
    role: Joi.string().valid('employee', 'manager', 'admin').default('employee'),
    managerId: Joi.number().integer().positive().allow(null)
  }).custom((value, helpers) => {
    if (!value.name && !(value.firstName && value.lastName)) {
      return helpers.error('any.custom', { message: 'Name is required' });
    }
    return value;
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Goal creation
  createGoal: Joi.object({
    goalSheetId: Joi.number().integer().positive().required(),
    thrustArea: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().allow('', null),
    uom: Joi.string().valid('numeric_min', 'numeric_max', 'percentage_min', 'percentage_max', 'timeline', 'zero').required(),
    target: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    weightage: Joi.number().min(10).max(100).required(),
    status: Joi.string().valid('not_started', 'on_track', 'completed').default('not_started')
  }),

  // Goal update
  updateGoal: Joi.object({
    thrustArea: Joi.string(),
    title: Joi.string(),
    description: Joi.string(),
    uom: Joi.string().valid('numeric_min', 'numeric_max', 'percentage_min', 'percentage_max', 'timeline', 'zero'),
    target: Joi.alternatives().try(Joi.number(), Joi.string()),
    weightage: Joi.number().min(10).max(100),
    status: Joi.string().valid('not_started', 'on_track', 'completed')
  }).min(1),

  // Goal approval
  approveGoal: Joi.object({
    action: Joi.string().valid('approve', 'return').required(),
    comments: Joi.string().when('action', {
      is: 'return',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    inlineEdits: Joi.array().items(
      Joi.object({
        goalId: Joi.number().integer().positive().required(),
        description: Joi.string(),
        target: Joi.number(),
        weightage: Joi.number().min(10).max(100)
      })
    )
  }),

  // Check-in creation
  createCheckin: Joi.object({
    goalId: Joi.number().integer().positive().required(),
    quarter: Joi.string().valid('Q1', 'Q2', 'Q3', 'Q4').required(),
    achievement: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    status: Joi.string().valid('not_started', 'on_track', 'completed').default('on_track'),
    comments: Joi.string().allow('', null)
  }),

  // Check-in comment
  checkinComment: Joi.object({
    comment: Joi.string().required()
  }),

  // Goal sheet creation
  createGoalSheet: Joi.object({
    fiscalYear: Joi.string().required(),
    employeeId: Joi.number().integer().positive()
  }),

  // Thrust area
  thrustArea: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null)
  }),

  // Date range query
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // Report filters
  reportFilters: Joi.object({
    fiscalYear: Joi.string(),
    employeeId: Joi.number().integer().positive(),
    managerId: Joi.number().integer().positive(),
    quarter: Joi.string().valid('Q1', 'Q2', 'Q3', 'Q4'),
    status: Joi.string().valid('draft', 'submitted', 'approved', 'returned', 'locked')
  })
};

module.exports = {
  validate,
  schemas
};
