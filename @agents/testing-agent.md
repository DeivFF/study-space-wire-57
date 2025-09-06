# Testing Agent - Testes e Qualidade

## Responsabilidades

Este agente é especializado em:
- Criação de testes unitários e de integração
- Testes end-to-end (E2E)
- Mocks e fixtures de dados
- Configuração de ambientes de teste
- Cobertura de código e qualidade

## Contexto do Projeto

### Stack de Testes
- **Backend:** Jest + Supertest
- **Frontend:** Vitest + React Testing Library + MSW
- **E2E:** Playwright
- **Command:** `cd backend && bun run test`

### Estrutura de Testes Existente
- Backend: Jest configurado
- Frontend: Vitest com Vite
- Comandos disponíveis no CLAUDE.md

## Tarefas Específicas

### 1. Configuração de Testes

#### Backend Test Setup
```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/migrations/**',
    '!src/index.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Database Test Setup
```javascript
// backend/src/tests/setup.js
const { Pool } = require('pg');

let testDb;

beforeAll(async () => {
  // Configurar banco de teste
  testDb = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'study_platform_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
  });

  // Executar migrations de teste
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await testDb.query(`
    CREATE TABLE IF NOT EXISTS study_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7),
      icon VARCHAR(100),
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await testDb.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7),
      study_type_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (study_type_id) REFERENCES study_types(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await testDb.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT,
      subject_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_index INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

beforeEach(async () => {
  // Limpar dados entre testes
  await testDb.query('TRUNCATE TABLE lessons RESTART IDENTITY CASCADE');
  await testDb.query('TRUNCATE TABLE subjects RESTART IDENTITY CASCADE');
  await testDb.query('TRUNCATE TABLE study_types RESTART IDENTITY CASCADE');
  await testDb.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await testDb.end();
});

global.testDb = testDb;
```

### 2. Fixtures e Mocks

#### Data Fixtures
```javascript
// backend/src/tests/fixtures/users.js
const bcrypt = require('bcrypt');

const createUserFixture = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Test User',
  };

  return { ...defaultUser, ...overrides };
};

const createUsersFixture = async (count = 3) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUserFixture({
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
    }));
  }
  return users;
};

module.exports = {
  createUserFixture,
  createUsersFixture,
};
```

#### Study Data Fixtures
```javascript
// backend/src/tests/fixtures/study.js
const createStudyTypeFixture = (userId, overrides = {}) => {
  const defaultStudyType = {
    name: 'ENEM',
    description: 'Preparação para o ENEM',
    color: '#3B82F6',
    icon: 'graduation-cap',
    user_id: userId,
  };

  return { ...defaultStudyType, ...overrides };
};

const createSubjectFixture = (studyTypeId, userId, overrides = {}) => {
  const defaultSubject = {
    name: 'Matemática',
    description: 'Matemática básica e avançada',
    color: '#10B981',
    study_type_id: studyTypeId,
    user_id: userId,
    order_index: 0,
  };

  return { ...defaultSubject, ...overrides };
};

const createLessonFixture = (subjectId, userId, overrides = {}) => {
  const defaultLesson = {
    title: 'Introdução à Álgebra',
    description: 'Conceitos básicos de álgebra',
    content: 'Conteúdo da aula...',
    subject_id: subjectId,
    user_id: userId,
    order_index: 0,
    duration_minutes: 60,
    completed: false,
  };

  return { ...defaultLesson, ...overrides };
};

const createCompleteStudyStructure = async (userId) => {
  // Criar tipo de estudo
  const studyTypeResult = await global.testDb.query(
    'INSERT INTO study_types (name, description, color, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    ['ENEM', 'Preparação para o ENEM', '#3B82F6', userId]
  );
  const studyType = studyTypeResult.rows[0];

  // Criar disciplinas
  const mathResult = await global.testDb.query(
    'INSERT INTO subjects (name, description, study_type_id, user_id, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    ['Matemática', 'Matemática para o ENEM', studyType.id, userId, 0]
  );
  const mathSubject = mathResult.rows[0];

  const portugueseResult = await global.testDb.query(
    'INSERT INTO subjects (name, description, study_type_id, user_id, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    ['Português', 'Português para o ENEM', studyType.id, userId, 1]
  );
  const portugueseSubject = portugueseResult.rows[0];

  // Criar aulas
  const lessons = [];
  const mathLessons = [
    { title: 'Álgebra Básica', order: 0 },
    { title: 'Funções', order: 1 },
    { title: 'Geometria', order: 2 },
  ];

  for (const lessonData of mathLessons) {
    const result = await global.testDb.query(
      'INSERT INTO lessons (title, subject_id, user_id, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [lessonData.title, mathSubject.id, userId, lessonData.order]
    );
    lessons.push(result.rows[0]);
  }

  return {
    studyType,
    subjects: [mathSubject, portugueseSubject],
    lessons,
  };
};

module.exports = {
  createStudyTypeFixture,
  createSubjectFixture,
  createLessonFixture,
  createCompleteStudyStructure,
};
```

### 3. Testes Unitários Backend

#### Models Tests
```javascript
// backend/src/tests/models/StudyType.test.js
const StudyType = require('../../models/StudyType');
const { createUserFixture } = require('../fixtures/users');

describe('StudyType Model', () => {
  let userId;

  beforeEach(async () => {
    // Criar usuário de teste
    const user = await createUserFixture();
    const result = await global.testDb.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [user.email, user.password, user.name]
    );
    userId = result.rows[0].id;
  });

  describe('create', () => {
    it('should create a study type successfully', async () => {
      const studyTypeData = {
        name: 'ENEM',
        description: 'Preparação para o ENEM',
        color: '#3B82F6',
        icon: 'graduation-cap',
      };

      const result = await StudyType.create(userId, studyTypeData);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        name: 'ENEM',
        description: 'Preparação para o ENEM',
        color: '#3B82F6',
        icon: 'graduation-cap',
        user_id: userId,
      });
      expect(result.rows[0].id).toBeDefined();
      expect(result.rows[0].created_at).toBeDefined();
    });

    it('should fail to create study type without required fields', async () => {
      await expect(StudyType.create(userId, {})).rejects.toThrow();
    });
  });

  describe('findByUser', () => {
    it('should return study types for user with counts', async () => {
      // Criar estrutura completa
      await createCompleteStudyStructure(userId);

      const result = await StudyType.findByUser(userId);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        name: 'ENEM',
        subjects_count: '2',
        lessons_count: '3',
        completed_lessons: '0',
      });
    });

    it('should return empty array for user with no study types', async () => {
      const result = await StudyType.findByUser(userId);
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return study type by id for correct user', async () => {
      const { studyType } = await createCompleteStudyStructure(userId);
      
      const result = await StudyType.findById(studyType.id, userId);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        id: studyType.id,
        name: 'ENEM',
        user_id: userId,
      });
    });

    it('should not return study type for different user', async () => {
      const { studyType } = await createCompleteStudyStructure(userId);
      
      const result = await StudyType.findById(studyType.id, 999);
      
      expect(result.rows).toHaveLength(0);
    });
  });
});
```

#### Controller Tests
```javascript
// backend/src/tests/controllers/studyTypeController.test.js
const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const { createUserFixture } = require('../fixtures/users');

describe('StudyType Controller', () => {
  let userId;
  let token;

  beforeEach(async () => {
    // Criar usuário e token de teste
    const user = await createUserFixture();
    const result = await global.testDb.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [user.email, user.password, user.name]
    );
    userId = result.rows[0].id;
    
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret');
  });

  describe('POST /api/study-types', () => {
    it('should create a new study type', async () => {
      const studyTypeData = {
        name: 'ENEM',
        description: 'Preparação para o ENEM',
        color: '#3B82F6',
        icon: 'graduation-cap',
      };

      const response = await request(app)
        .post('/api/study-types')
        .set('Authorization', `Bearer ${token}`)
        .send(studyTypeData)
        .expect(201);

      expect(response.body).toMatchObject(studyTypeData);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/study-types')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Missing name' })
        .expect(400);

      expect(response.body.error).toBe('Nome é obrigatório');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/study-types')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('GET /api/study-types', () => {
    it('should return user study types with stats', async () => {
      await createCompleteStudyStructure(userId);

      const response = await request(app)
        .get('/api/study-types')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'ENEM',
        subjects_count: '2',
        lessons_count: '3',
      });
    });

    it('should return empty array for user with no study types', async () => {
      const response = await request(app)
        .get('/api/study-types')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/study-types/:id', () => {
    it('should update study type', async () => {
      const { studyType } = await createCompleteStudyStructure(userId);

      const updateData = {
        name: 'ENEM 2024',
        description: 'Preparação atualizada',
        color: '#EF4444',
      };

      const response = await request(app)
        .put(`/api/study-types/${studyType.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
    });

    it('should return 404 for non-existent study type', async () => {
      await request(app)
        .put('/api/study-types/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/study-types/:id', () => {
    it('should delete study type and cascade', async () => {
      const { studyType } = await createCompleteStudyStructure(userId);

      await request(app)
        .delete(`/api/study-types/${studyType.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Verificar cascade delete
      const subjectsResult = await global.testDb.query(
        'SELECT * FROM subjects WHERE study_type_id = $1',
        [studyType.id]
      );
      expect(subjectsResult.rows).toHaveLength(0);
    });
  });
});
```

### 4. Testes Frontend

#### Frontend Test Setup
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
```

#### MSW Setup
```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw';
import { StudyType, Subject, Lesson } from '@/types/study';

const API_BASE = 'http://localhost:3002/api';

const mockStudyTypes: StudyType[] = [
  {
    id: 1,
    name: 'ENEM',
    description: 'Preparação para o ENEM',
    color: '#3B82F6',
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subjects_count: 2,
    lessons_count: 5,
    completed_lessons: 1,
    progress_percentage: 20,
  },
];

export const handlers = [
  rest.get(`${API_BASE}/study-types`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStudyTypes));
  }),

  rest.post(`${API_BASE}/study-types`, (req, res, ctx) => {
    const newStudyType = {
      id: Date.now(),
      ...req.body,
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return res(ctx.status(201), ctx.json(newStudyType));
  }),

  rest.put(`${API_BASE}/study-types/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updated = {
      ...mockStudyTypes[0],
      ...req.body,
      updated_at: new Date().toISOString(),
    };
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.delete(`${API_BASE}/study-types/:id`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),
];
```

#### Component Tests
```typescript
// src/components/study/__tests__/StudyTypeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StudyTypeCard } from '../StudyTypeCard';
import { StudyType } from '@/types/study';

const mockStudyType: StudyType = {
  id: 1,
  name: 'ENEM',
  description: 'Preparação para o ENEM',
  color: '#3B82F6',
  user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subjects_count: 2,
  lessons_count: 5,
  completed_lessons: 1,
  progress_percentage: 20,
};

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

describe('StudyTypeCard', () => {
  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it('should render study type information', () => {
    render(
      <StudyTypeCard
        studyType={mockStudyType}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('ENEM')).toBeInTheDocument();
    expect(screen.getByText('Preparação para o ENEM')).toBeInTheDocument();
    expect(screen.getByText('2 disciplinas')).toBeInTheDocument();
    expect(screen.getByText('5 aulas')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <StudyTypeCard
        studyType={mockStudyType}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Editar'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockStudyType);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <StudyTypeCard
        studyType={mockStudyType}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Excluir'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockStudyType);
  });

  it('should display progress correctly', () => {
    render(
      <StudyTypeCard
        studyType={mockStudyType}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveAttribute('aria-valuenow', '20');
  });
});
```

### 5. Hook Tests
```typescript
// src/hooks/__tests__/useStudyTypes.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudyTypes } from '../useStudyTypes';
import { server } from '@/test/mocks/server';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useStudyTypes', () => {
  it('should fetch study types successfully', async () => {
    const { result } = renderHook(() => useStudyTypes(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('ENEM');
  });

  it('should handle error state', async () => {
    server.use(
      rest.get('http://localhost:3002/api/study-types', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useStudyTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### 6. E2E Tests

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && bun run dev',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

#### E2E Test Example
```typescript
// tests/e2e/study-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Study Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user authentication
    await page.goto('/');
    
    // Simulate login
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }));
    });
    
    await page.reload();
  });

  test('should create a new study type', async ({ page }) => {
    await page.goto('/');
    
    // Click "Novo Tipo de Estudo" button
    await page.click('text=Novo Tipo de Estudo');
    
    // Fill form
    await page.fill('input[name="name"]', 'Vestibular');
    await page.fill('textarea[name="description"]', 'Preparação para vestibular');
    
    // Select color
    await page.click('[data-testid="color-picker"] button[data-color="#10B981"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify creation
    await expect(page.locator('text=Vestibular')).toBeVisible();
    await expect(page.locator('text=Preparação para vestibular')).toBeVisible();
  });

  test('should navigate through study hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Click on a study type
    await page.click('[data-testid="study-type-card"]:first-child');
    
    // Should navigate to subjects page
    await expect(page).toHaveURL(/\/study\/\d+/);
    await expect(page.locator('text=Disciplinas')).toBeVisible();
    
    // Click on a subject
    await page.click('[data-testid="subject-card"]:first-child');
    
    // Should navigate to lessons page
    await expect(page).toHaveURL(/\/study\/\d+\/subject\/\d+/);
    await expect(page.locator('text=Aulas')).toBeVisible();
  });

  test('should complete a lesson', async ({ page }) => {
    await page.goto('/study/1/subject/1');
    
    // Click on a lesson
    await page.click('[data-testid="lesson-card"]:first-child');
    
    // Mark as complete
    await page.click('button:has-text("Marcar como Concluída")');
    
    // Verify completion
    await expect(page.locator('[data-testid="lesson-completed-badge"]')).toBeVisible();
    
    // Go back and verify progress updated
    await page.goBack();
    await expect(page.locator('text=1/3 concluídas')).toBeVisible();
  });

  test('should handle offline state', async ({ page, context }) => {
    await page.goto('/');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to create study type
    await page.click('text=Novo Tipo de Estudo');
    await page.fill('input[name="name"]', 'Offline Test');
    await page.click('button[type="submit"]');
    
    // Should show offline message
    await expect(page.locator('text=Sem conexão')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    await page.reload();
    
    // Should sync and show created item
    await expect(page.locator('text=Offline Test')).toBeVisible();
  });
});
```

## Entregáveis

### Test Infrastructure
- Jest e Vitest configurados
- MSW para mock de APIs
- Playwright para E2E
- Database seeding para testes

### Unit Tests
- Models com 100% coverage
- Controllers com casos de erro
- Hooks customizados
- Utility functions

### Integration Tests
- API endpoints completos
- Authentication flows
- Database transactions
- Error scenarios

### E2E Tests
- User journeys principais
- Responsive behavior
- Performance checks
- Accessibility tests

### Quality Metrics
- Code coverage > 80%
- Performance budgets
- Accessibility scores
- Bundle size monitoring

### CI/CD Integration
- GitHub Actions workflows
- Automated test runs
- Coverage reporting
- Performance regression detection