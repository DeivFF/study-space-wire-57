import Joi from 'joi';

/**
 * Validation schemas for different post types
 */
const postValidationSchemas = {
  // Base post schema
  basePost: Joi.object({
    title: Joi.string().max(255).optional().allow('').messages({
      'string.max': 'Title cannot exceed 255 characters'
    }),
    content: Joi.string().min(1).max(10000).required().messages({
      'string.min': 'Content is required',
      'string.max': 'Content cannot exceed 10,000 characters',
      'any.required': 'Content is required'
    }),
    category: Joi.string().max(100).optional().allow('').messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
    tags: Joi.array().items(
      Joi.string().max(50).trim()
    ).max(10).optional().messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Each tag cannot exceed 50 characters'
    }),
    isAnonymous: Joi.boolean().optional().default(false)
  }),

  // Publicacao schema (minimal requirements)
  publicacao: Joi.object({
    data: Joi.object({
      tema: Joi.string().max(100).optional(),
      descricao_adicional: Joi.string().max(1000).optional()
    }).optional().default({})
  }),

  // Duvida schema
  duvida: Joi.object({
    title: Joi.string().min(5).max(255).required().messages({
      'string.min': 'Title must be at least 5 characters for questions',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required for questions'
    }),
    data: Joi.object({
      categoria_materia: Joi.string().valid(
        'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
        'portugues', 'literatura', 'filosofia', 'sociologia', 'ingles', 'espanhol',
        'programacao', 'engenharia', 'medicina', 'direito', 'administracao',
        'economia', 'psicologia', 'artes', 'musica', 'educacao_fisica', 'outros'
      ).required().messages({
        'any.required': 'Subject category is required for questions',
        'any.only': 'Invalid subject category'
      }),
      nivel_dificuldade: Joi.string().valid(
        'iniciante', 'intermediario', 'avancado', 'especialista'
      ).required().messages({
        'any.required': 'Difficulty level is required for questions',
        'any.only': 'Difficulty level must be one of: iniciante, intermediario, avancado, especialista'
      }),
      tempo_estudo: Joi.string().max(50).optional(),
      recursos_utilizados: Joi.array().items(Joi.string()).optional(),
      tentativas_previas: Joi.string().max(1000).optional()
    }).required()
  }),

  // Exercicio schema
  exercicio: Joi.object({
    title: Joi.string().min(5).max(255).required().messages({
      'string.min': 'Title must be at least 5 characters for exercises',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required for exercises'
    }),
    data: Joi.object({
      tipo_exercicio: Joi.string().valid(
        'pratica', 'teoria', 'projeto', 'desafio_codigo'
      ).required().messages({
        'any.required': 'Exercise type is required',
        'any.only': 'Exercise type must be one of: pratica, teoria, projeto, desafio_codigo'
      }),
      nivel_dificuldade: Joi.string().valid(
        'iniciante', 'intermediario', 'avancado', 'especialista'
      ).required().messages({
        'any.required': 'Difficulty level is required for exercises',
        'any.only': 'Difficulty level must be one of: iniciante, intermediario, avancado, especialista'
      }),
      categoria_materia: Joi.string().valid(
        'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
        'portugues', 'literatura', 'filosofia', 'sociologia', 'ingles', 'espanhol',
        'programacao', 'engenharia', 'medicina', 'direito', 'administracao',
        'economia', 'psicologia', 'artes', 'musica', 'educacao_fisica', 'outros'
      ).optional(),
      tempo_estimado: Joi.string().max(50).optional(),
      prerequisitos: Joi.array().items(Joi.string()).optional(),
      recursos_necessarios: Joi.array().items(Joi.string()).optional(),
      solucao_disponivel: Joi.boolean().optional(),
      pontuacao_maxima: Joi.number().min(0).max(1000).optional()
    }).required()
  }),

  // Desafio schema
  desafio: Joi.object({
    title: Joi.string().min(5).max(255).optional().messages({
      'string.min': 'Title must be at least 5 characters if provided',
      'string.max': 'Title cannot exceed 255 characters'
    }),
    data: Joi.object({
      nivel_dificuldade: Joi.string().valid(
        'iniciante', 'intermediario', 'avancado', 'especialista'
      ).required().messages({
        'any.required': 'Difficulty level is required for challenges',
        'any.only': 'Difficulty level must be one of: iniciante, intermediario, avancado, especialista'
      }),
      prazo_limite: Joi.date().greater('now').required().messages({
        'date.greater': 'Challenge deadline must be in the future',
        'any.required': 'Challenge deadline is required'
      }),
      categoria_materia: Joi.string().valid(
        'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
        'portugues', 'literatura', 'filosofia', 'sociologia', 'ingles', 'espanhol',
        'programacao', 'engenharia', 'medicina', 'direito', 'administracao',
        'economia', 'psicologia', 'artes', 'musica', 'educacao_fisica', 'outros'
      ).optional(),
      premiacao: Joi.string().max(500).optional(),
      criterios_avaliacao: Joi.array().items(Joi.string()).optional(),
      max_participantes: Joi.number().min(1).max(1000).optional(),
      tipo_desafio: Joi.string().valid(
        'individual', 'grupo', 'competitivo', 'colaborativo'
      ).optional(),
      recursos_permitidos: Joi.array().items(Joi.string()).optional()
    }).required()
  }),

  // Enquete schema
  enquete: Joi.object({
    title: Joi.string().min(5).max(255).required().messages({
      'string.min': 'Title must be at least 5 characters for polls',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required for polls'
    }),
    data: Joi.object({
      poll_question: Joi.string().min(5).max(255).required().messages({
        'string.min': 'Poll question must be at least 5 characters',
        'string.max': 'Poll question cannot exceed 255 characters',
        'any.required': 'Poll question is required'
      }),
      poll_options: Joi.array().items(Joi.string().min(1).max(100)).min(2).max(8).required().messages({
        'array.min': 'At least 2 poll options are required',
        'array.max': 'Maximum 8 poll options allowed',
        'any.required': 'Poll options are required'
      }),
      poll_multi: Joi.boolean().optional().default(false),
      poll_duration: Joi.number().min(1).max(30).required().messages({
        'number.min': 'Poll duration must be at least 1 day',
        'number.max': 'Poll duration cannot exceed 30 days',
        'any.required': 'Poll duration is required'
      })
    }).required()
  })
};

/**
 * Validation schemas for post updates
 */
const updateValidationSchemas = {
  baseUpdate: Joi.object({
    title: Joi.string().max(255).optional().allow('').messages({
      'string.max': 'Title cannot exceed 255 characters'
    }),
    content: Joi.string().min(1).max(10000).optional().messages({
      'string.min': 'Content cannot be empty',
      'string.max': 'Content cannot exceed 10,000 characters'
    }),
    category: Joi.string().max(100).optional().allow('').messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
    tags: Joi.array().items(
      Joi.string().max(50).trim()
    ).max(10).optional().messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Each tag cannot exceed 50 characters'
    }),
    data: Joi.object().optional()
  })
};


/**
 * Validate post creation based on type
 */
export const validatePostCreation = (req, res, next) => {
  try {
    // Get type from URL params first, then from body, default to 'publicacao'
    const type = req.params.type || req.body.type || 'publicacao';
    
    // Validate post type
    const validTypes = ['publicacao', 'duvida', 'exercicio', 'desafio', 'enquete'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid post type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate base post fields
    const baseValidation = postValidationSchemas.basePost.validate(req.body, {
      abortEarly: false,
      allowUnknown: true
    });

    if (baseValidation.error) {
      const errors = baseValidation.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Validate type-specific fields
    const typeValidation = postValidationSchemas[type].validate(req.body, {
      abortEarly: false,
      allowUnknown: true
    });

    if (typeValidation.error) {
      const errors = typeValidation.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Type-specific validation failed',
        errors
      });
    }

    // Merge validated data
    req.body = {
      ...baseValidation.value,
      ...typeValidation.value,
      type
    };

    next();
  } catch (error) {
    console.error('Post validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

/**
 * Validate post update
 */
export const validatePostUpdate = (req, res, next) => {
  try {
    const validation = updateValidationSchemas.baseUpdate.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validation.error) {
      const errors = validation.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Don't allow updating post type or anonymous status
    delete validation.value.type;
    delete validation.value.isAnonymous;

    req.body = validation.value;
    next();
  } catch (error) {
    console.error('Post update validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

/**
 * Validate search parameters
 */
export const validatePostSearch = (req, res, next) => {
  try {
    const searchSchema = Joi.object({
      q: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Search query is required',
        'string.max': 'Search query cannot exceed 200 characters',
        'any.required': 'Search query is required'
      }),
      type: Joi.string().valid('publicacao', 'duvida', 'exercicio', 'desafio').optional(),
      tags: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
      ).optional(),
      limit: Joi.number().min(1).max(100).optional().default(20),
      offset: Joi.number().min(0).optional().default(0)
    });

    const validation = searchSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validation.error) {
      const errors = validation.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Search validation failed',
        errors
      });
    }

    req.query = validation.value;
    next();
  } catch (error) {
    console.error('Search validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

/**
 * Validate filter parameters
 */
export const validatePostFilters = (req, res, next) => {
  try {
    const filterSchema = Joi.object({
      userId: Joi.string().uuid().optional(),
      type: Joi.string().valid('publicacao', 'duvida', 'exercicio', 'desafio').optional(),
      tags: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
      ).optional(),
      categoriaMateria: Joi.string().valid(
        'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
        'portugues', 'literatura', 'filosofia', 'sociologia', 'ingles', 'espanhol',
        'programacao', 'engenharia', 'medicina', 'direito', 'administracao',
        'economia', 'psicologia', 'artes', 'musica', 'educacao_fisica', 'outros'
      ).optional(),
      nivelDificuldade: Joi.string().valid(
        'iniciante', 'intermediario', 'avancado', 'especialista'
      ).optional(),
      includeAnonymous: Joi.boolean().optional().default(true),
      limit: Joi.number().min(1).max(100).optional().default(20),
      offset: Joi.number().min(0).optional().default(0)
    });

    const validation = filterSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validation.error) {
      const errors = validation.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Filter validation failed',
        errors
      });
    }

    req.query = validation.value;
    next();
  } catch (error) {
    console.error('Filter validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

/**
 * Sanitize post content to prevent XSS and other security issues
 */
export const sanitizePostContent = (req, res, next) => {
  try {
    if (req.body.title) {
      // Remove HTML tags and trim whitespace
      req.body.title = req.body.title.replace(/<[^>]*>/g, '').trim();
    }

    if (req.body.content) {
      // Basic HTML sanitization - remove script tags and on* attributes
      req.body.content = req.body.content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim();
    }

    if (req.body.category) {
      req.body.category = req.body.category.replace(/<[^>]*>/g, '').trim();
    }

    // Sanitize tags
    if (req.body.tags && Array.isArray(req.body.tags)) {
      req.body.tags = req.body.tags.map(tag => 
        tag.replace(/<[^>]*>/g, '').trim().toLowerCase()
      ).filter(tag => tag.length > 0);
    }

    // Sanitize JSONB data strings
    if (req.body.data && typeof req.body.data === 'object') {
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
          } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
              typeof item === 'string' ? item.replace(/<[^>]*>/g, '').trim() : item
            );
          } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      req.body.data = sanitizeObject(req.body.data);
    }

    next();
  } catch (error) {
    console.error('Content sanitization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during content sanitization'
    });
  }
};

/**
 * Check if user has permission to perform action on post
 */
export const checkPostPermission = (action = 'read') => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;

      // For creation, no additional permission check needed
      if (action === 'create') {
        return next();
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post ID format'
        });
      }

      // Add post permission info to request
      req.postAction = action;
      req.postId = id;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

export default {
  validatePostCreation,
  validatePostUpdate,
  validatePostSearch,
  validatePostFilters,
  sanitizePostContent,
  checkPostPermission
};