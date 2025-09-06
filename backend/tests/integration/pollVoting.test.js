import request from 'supertest';
import express from 'express';
import postsRouter from '../../src/routes/posts.js';
import { authenticateToken } from '../../src/middleware/authenticateToken.js';

// Mock the authenticateToken middleware
jest.mock('../../src/middleware/authenticateToken.js');

// Create a test app
const app = express();
app.use(express.json());

// Mock authentication for tests
authenticateToken.mockImplementation((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

// Mount the posts router
app.use('/api/posts', postsRouter);

describe('Poll Voting API', () => {
  describe('POST /api/posts/:id/vote', () => {
    it('should successfully record a vote', async () => {
      const response = await request(app)
        .post('/api/posts/test-post-id/vote')
        .send({ optionIndex: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vote recorded successfully');
      expect(response.body.data).toBeDefined();
    });

    it('should reject invalid post ID format', async () => {
      const response = await request(app)
        .post('/api/posts/invalid-id/vote')
        .send({ optionIndex: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid post ID format');
    });

    it('should reject missing option index', async () => {
      const response = await request(app)
        .post('/api/posts/test-post-id/vote')
        .send({}) // Missing optionIndex
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid option index');
    });

    it('should reject invalid option index type', async () => {
      const response = await request(app)
        .post('/api/posts/test-post-id/vote')
        .send({ optionIndex: 'invalid' }) // String instead of number
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid option index');
    });

    it('should reject negative option index', async () => {
      const response = await request(app)
        .post('/api/posts/test-post-id/vote')
        .send({ optionIndex: -1 }) // Negative index
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid option index');
    });
  });

  describe('GET /api/posts/:id/results', () => {
    it('should successfully retrieve poll results', async () => {
      const response = await request(app)
        .get('/api/posts/test-post-id/results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject invalid post ID format', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id/results')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid post ID format');
    });
  });
});