import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter middleware
 * Limits requests to 100 per 10 minutes window
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000, // 10 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  }
});

/**
 * Auth-specific rate limiter for login/register endpoints
 * More restrictive to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development or during Cypress tests
    const isDev = process.env.NODE_ENV === 'development';
    const isCypress = req.headers['user-agent']?.includes('Cypress') || process.env.NODE_ENV === 'test';
    return isDev || isCypress;
  }
});

/**
 * Password reset rate limiter
 * Very restrictive to prevent abuse
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: parseInt(process.env.PASSWORD_RESET_WINDOW_MS) || 3600000, // 1 hour
  max: parseInt(process.env.PASSWORD_RESET_MAX_REQUESTS) || 3, // limit each IP to 3 password reset requests per windowMs
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Post creation rate limiter
 * Prevents spam posting across all post types
 */
export const postCreationRateLimiter = rateLimit({
  windowMs: parseInt(process.env.POST_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.POST_RATE_LIMIT_MAX_REQUESTS) || 10, // 10 posts per 15 minutes
  message: {
    success: false,
    message: 'Too many posts created. Please wait before creating another post.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    // Different limits based on post type and user
    const type = req.body?.type || req.params?.type || 'default';
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-${type}`;
  }
});

/**
 * Anonymous post rate limiter
 * More restrictive for anonymous posts to prevent abuse
 */
export const anonymousPostRateLimiter = rateLimit({
  windowMs: parseInt(process.env.ANONYMOUS_POST_WINDOW_MS) || 1800000, // 30 minutes
  max: parseInt(process.env.ANONYMOUS_POST_MAX_REQUESTS) || 5, // 5 anonymous posts per 30 minutes
  message: {
    success: false,
    message: 'Too many anonymous posts. Please wait before creating another anonymous post.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' || !req.body?.isAnonymous;
  },
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-anonymous`;
  }
});

/**
 * Challenge creation rate limiter
 * Special rate limiting for desafio posts due to their competitive nature
 */
export const challengeCreationRateLimiter = rateLimit({
  windowMs: parseInt(process.env.CHALLENGE_RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
  max: parseInt(process.env.CHALLENGE_RATE_LIMIT_MAX_REQUESTS) || 3, // 3 challenges per hour
  message: {
    success: false,
    message: 'Too many challenges created. Please wait before creating another challenge.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const type = req.body?.type || req.params?.type;
    return process.env.NODE_ENV === 'development' || type !== 'desafio';
  },
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-challenge`;
  }
});

/**
 * Post interaction rate limiter (likes, comments)
 * Prevents spam interactions
 */
export const postInteractionRateLimiter = rateLimit({
  windowMs: parseInt(process.env.POST_INTERACTION_WINDOW_MS) || 300000, // 5 minutes
  max: parseInt(process.env.POST_INTERACTION_MAX_REQUESTS) || 50, // 50 interactions per 5 minutes
  message: {
    success: false,
    message: 'Too many post interactions. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-interaction`;
  }
});

/**
 * Search rate limiter
 * Prevents abuse of search functionality
 */
export const searchRateLimiter = rateLimit({
  windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX_REQUESTS) || 30, // 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests. Please wait before searching again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}-search`;
  }
});