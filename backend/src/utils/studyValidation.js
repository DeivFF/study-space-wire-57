import Joi from 'joi';

export const studyValidationSchemas = {
  // Study Type schemas (frontend calls them "exams")
  createStudyType: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#007bff'),
    icon: Joi.string().max(100).default('book')
  }),

  updateStudyType: Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    icon: Joi.string().max(100)
  }),

  // Subject schemas
  createSubject: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#28a745')
  }),

  updateSubject: Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    order_index: Joi.number().integer().min(0)
  }),

  // Lesson schemas
  createLesson: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    content: Joi.string(),
    difficulty: Joi.string().valid('facil', 'medio', 'dificil').default('medio'),
    duration_minutes: Joi.number().integer().min(1).max(600)
  }),

  updateLesson: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    content: Joi.string(),
    difficulty: Joi.string().valid('facil', 'medio', 'dificil'),
    progress: Joi.number().integer().min(0).max(100),
    accuracy: Joi.number().integer().min(0).max(100),
    completed: Joi.boolean(),
    duration_minutes: Joi.number().integer().min(1).max(600)
  }),

  // Note schemas
  createNote: Joi.object({
    title: Joi.string().max(255),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).default([])
  }),

  updateNote: Joi.object({
    title: Joi.string().max(255),
    content: Joi.string(),
    tags: Joi.array().items(Joi.string().max(50)).max(20)
  }),

  // Flashcard schemas
  createFlashcard: Joi.object({
    front_content: Joi.string().min(1).required(),
    back_content: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).default([])
  }),

  updateFlashcard: Joi.object({
    front_content: Joi.string().min(1),
    back_content: Joi.string().min(1),
    tags: Joi.array().items(Joi.string().max(50)).max(20)
  }),

  reviewFlashcard: Joi.object({
    quality: Joi.number().integer().min(0).max(5).required(),
    session_id: Joi.string().uuid()
  }),

  // Exercise schemas
  createExercise: Joi.object({
    question_text: Joi.string().min(1).required(),
    question_type: Joi.string().valid('multiple_choice', 'essay', 'true_false').default('multiple_choice'),
    options: Joi.when('question_type', {
      is: 'multiple_choice',
      then: Joi.array().items(Joi.string()).min(2).required(),
      otherwise: Joi.forbidden()
    }),
    correct_answer: Joi.string().allow('').required(),
    explanation: Joi.string(),
    difficulty: Joi.string().valid('facil', 'medio', 'dificil').default('medio'),
    tags: Joi.array().items(Joi.string().max(50)).max(20).default([])
  }),

  updateExercise: Joi.object({
    question_text: Joi.string().min(1),
    question_type: Joi.string().valid('multiple_choice', 'essay', 'true_false'),
    options: Joi.array().items(Joi.string()).min(2),
    correct_answer: Joi.string(),
    explanation: Joi.string(),
    difficulty: Joi.string().valid('facil', 'medio', 'dificil'),
    tags: Joi.array().items(Joi.string().max(50)).max(20)
  }),

  attemptExercise: Joi.object({
    user_answer: Joi.string().required(),
    time_spent_seconds: Joi.number().integer().min(0),
    session_id: Joi.string().uuid()
  })
};

// Custom error class for validation and app errors
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async wrapper function
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorDetails = {};
      error.details.forEach(detail => {
        errorDetails[detail.path.join('.')] = detail.message;
      });
      
      return res.status(422).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errorDetails
        }
      });
    }
    
    req.body = value;
    next();
  };
};