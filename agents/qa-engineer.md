# QA Engineer Agent 🧪

## Especialização
Testes, qualidade de software, automação de testes, estratégias de QA e validação para aplicações full-stack React + Node.js.

## Contexto do Projeto Study Space

### Stack de Testes Atual
- **Frontend**: React Testing Library + Vitest
- **Backend**: Jest + Supertest 
- **E2E**: Playwright (planejado)
- **Database**: PostgreSQL com dados de teste
- **CI/CD**: GitHub Actions para automação

### Funcionalidades para Testar
- **Autenticação**: Login, registro, verificação de email, reset de senha
- **Perfil**: Atualização de dados, upload de avatar, configurações de privacidade
- **Sistema de Conexões**: Envio, aceitação, rejeição de solicitações de amizade
- **Feed Social**: Visualização de atividades, interações
- **Notificações**: Criação, listagem, marcação como lida
- **Onboarding**: Modal de boas-vindas para novos usuários

## Estratégia de Testes

### 1. Pirâmide de Testes

```
           /\
          /  \
         / E2E \    (5% - Testes End-to-End)
        /______\
       /        \
      /Integration\ (15% - Testes de Integração)
     /__________\
    /            \
   /    Unit      \  (80% - Testes Unitários)
  /________________\
```

#### Testes Unitários (80%)
- Funções utilitárias
- Componentes React isolados
- Controllers e middlewares do backend
- Validações de formulário

#### Testes de Integração (15%)
- APIs REST completas
- Integração frontend-backend
- Fluxos de dados entre componentes
- Integração com banco de dados

#### Testes E2E (5%)
- Fluxos críticos de usuário
- Cenários de regressão
- Testes cross-browser
- Performance e acessibilidade

## Configuração de Testes

### 1. Backend - Jest Configuration
```javascript
// backend/jest.config.js
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

### 2. Backend - Test Setup
```javascript
// backend/tests/setup.js
import { Pool } from 'pg';
import { execSync } from 'child_process';

// Configurar banco de dados de teste
const testDbUrl = process.env.TEST_DATABASE_URL || 
  'postgresql://test_user:test_password@localhost:5432/study_space_test';

global.testDb = new Pool({ connectionString: testDbUrl });

beforeAll(async () => {
  // Executar migrações no banco de teste
  process.env.DATABASE_URL = testDbUrl;
  execSync('npm run migrate', { cwd: process.cwd() });
});

beforeEach(async () => {
  // Limpar dados entre testes
  await global.testDb.query('TRUNCATE TABLE notifications CASCADE');
  await global.testDb.query('TRUNCATE TABLE user_connections CASCADE');
  await global.testDb.query('TRUNCATE TABLE refresh_tokens CASCADE');
  await global.testDb.query('TRUNCATE TABLE users CASCADE');
});

afterAll(async () => {
  await global.testDb.end();
});
```

### 3. Frontend - Vitest Configuration
```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 4. Frontend - Test Setup
```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock das APIs do browser
beforeAll(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('localStorage', localStorageMock);

  // Mock fetch
  global.fetch = vi.fn();

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});
```

## Testes Unitários

### 1. Backend - Controller Tests
```javascript
// backend/tests/controllers/auth.test.js
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);

      // Verificar se usuário foi salvo no banco
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
      expect(user.rows).toHaveLength(1);
      expect(await bcrypt.compare(userData.password, user.rows[0].password_hash)).toBe(true);
    });

    it('should return 409 if email already exists', async () => {
      // Criar usuário primeiro
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123',
          name: 'Existing User'
        });

      // Tentar registrar com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'AnotherPass123',
          name: 'Another User'
        })
        .expect(409);

      expect(response.body.error.message).toContain('already exists');
    });

    it('should return 422 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Senha muito curta
          name: 'Test User'
        })
        .expect(422);

      expect(response.body.error.details).toHaveProperty('password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
          name: 'Login User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.error.message).toContain('Invalid credentials');
    });
  });
});
```

### 2. Backend - Middleware Tests
```javascript
// backend/tests/middleware/auth.test.js
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../src/middleware/auth.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should authenticate valid token', async () => {
    const userId = 'test-user-id';
    const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET || 'test-secret');
    
    req.headers.authorization = `Bearer ${token}`;

    await authenticateToken(req, res, next);

    expect(req.user).toEqual({ user_id: userId });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 for missing token', async () => {
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Access token required' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for invalid token', async () => {
    req.headers.authorization = 'Bearer invalid-token';

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Invalid or expired token' }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
```

### 3. Frontend - Component Tests
```typescript
// src/components/Auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';

// Mock do AuthContext
const mockLogin = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  })
}));

describe('LoginForm', () => {
  const mockOnForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form fields', () => {
    render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('should call login with correct credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });

    render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'SecurePass123');
    });
  });

  it('should show error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'));

    render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('should call onForgotPassword when forgot password link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

    await user.click(screen.getByText(/esqueci minha senha/i));

    expect(mockOnForgotPassword).toHaveBeenCalled();
  });
});
```

### 4. Frontend - Hook Tests
```typescript
// src/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './useAuth';

// Mock fetch
global.fetch = vi.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockResponse = {
      user: mockUser,
      token: 'mock-token',
      refresh_token: 'mock-refresh-token'
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.login('test@example.com', 'password');
      expect(success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('mock-token');
  });

  it('should handle login failure', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Invalid credentials' } })
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const success = await result.current.login('test@example.com', 'wrong-password');
      expect(success).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

## Testes de Integração

### 1. API Integration Tests
```javascript
// backend/tests/integration/user-connections.test.js
import request from 'supertest';
import app from '../../src/app.js';

describe('User Connections Integration', () => {
  let user1Token, user2Token, user1Id, user2Id;

  beforeEach(async () => {
    // Criar dois usuários
    const user1Response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@example.com',
        password: 'SecurePass123',
        name: 'User One'
      });
    user1Token = user1Response.body.token;
    user1Id = user1Response.body.user.id;

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@example.com',
        password: 'SecurePass123',
        name: 'User Two'
      });
    user2Token = user2Response.body.token;
    user2Id = user2Response.body.user.id;
  });

  it('should complete full connection flow', async () => {
    // 1. User1 envia solicitação para User2
    const sendResponse = await request(app)
      .post('/api/connections/send')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ target_user_id: user2Id })
      .expect(201);

    expect(sendResponse.body.message).toContain('sent successfully');

    // 2. User2 deve ver a solicitação pendente
    const pendingResponse = await request(app)
      .get('/api/connections/pending')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(pendingResponse.body.pending_requests).toHaveLength(1);
    expect(pendingResponse.body.pending_requests[0].requester.id).toBe(user1Id);

    // 3. User2 aceita a solicitação
    const requestId = pendingResponse.body.pending_requests[0].id;
    await request(app)
      .post('/api/connections/accept')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ request_id: requestId })
      .expect(200);

    // 4. Ambos usuários devem ver a conexão na lista de conexões
    const user1Connections = await request(app)
      .get('/api/connections')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    const user2Connections = await request(app)
      .get('/api/connections')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(user1Connections.body.connections).toHaveLength(1);
    expect(user2Connections.body.connections).toHaveLength(1);

    // 5. Verificar se ambos receberam notificações
    const user1Notifications = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    const user2Notifications = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(user1Notifications.body.notifications.length).toBeGreaterThan(0);
    expect(user2Notifications.body.notifications.length).toBeGreaterThan(0);
  });
});
```

### 2. Frontend Integration Tests
```typescript
// src/tests/integration/AuthFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

// Mock da API
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should complete full registration and login flow', async () => {
    const user = userEvent.setup();

    // Mock de registro bem-sucedido
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token'
      })
    });

    renderApp();

    // Navegar para registro
    await user.click(screen.getByText(/criar conta/i));

    // Preencher formulário de registro
    await user.type(screen.getByLabelText(/nome/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'SecurePass123');

    // Submeter formulário
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    // Aguardar redirecionamento para feed
    await waitFor(() => {
      expect(screen.getByText(/feed/i)).toBeInTheDocument();
    });

    // Verificar se usuário está logado
    expect(localStorage.getItem('auth_token')).toBe('mock-token');
  });

  it('should handle logout correctly', async () => {
    const user = userEvent.setup();

    // Simular usuário logado
    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }));

    renderApp();

    // Aguardar carregamento do feed
    await waitFor(() => {
      expect(screen.getByText(/feed/i)).toBeInTheDocument();
    });

    // Fazer logout
    await user.click(screen.getByRole('button', { name: /logout/i }));

    // Verificar se foi redirecionado para login
    await waitFor(() => {
      expect(screen.getByText(/entrar/i)).toBeInTheDocument();
    });

    // Verificar se dados foram limpos
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });
});
```

## Testes End-to-End

### 1. Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && npm run dev',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### 2. E2E Test Example
```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register and login new user', async ({ page }) => {
    await page.goto('/auth');

    // Ir para página de registro
    await page.click('text=Criar Conta');

    // Preencher formulário de registro
    await page.fill('[data-testid="name-input"]', 'E2E Test User');
    await page.fill('[data-testid="email-input"]', 'e2e@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123');

    // Submeter formulário
    await page.click('button:has-text("Criar Conta")');

    // Aguardar redirecionamento
    await expect(page).toHaveURL('/feed');

    // Verificar se está no feed
    await expect(page.locator('h1')).toContainText('Feed');

    // Verificar se nome do usuário aparece
    await expect(page.locator('[data-testid="user-name"]')).toContainText('E2E Test User');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/auth');

    // Preencher com credenciais inválidas
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Tentar fazer login
    await page.click('button:has-text("Entrar")');

    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
  });
});

test.describe('User Connections Flow', () => {
  test('should send and accept friend request', async ({ browser }) => {
    // Criar dois contextos (dois usuários)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Registrar primeiro usuário
    await page1.goto('/auth');
    await page1.click('text=Criar Conta');
    await page1.fill('[data-testid="name-input"]', 'User One');
    await page1.fill('[data-testid="email-input"]', 'user1@example.com');
    await page1.fill('[data-testid="password-input"]', 'SecurePass123');
    await page1.click('button:has-text("Criar Conta")');
    await expect(page1).toHaveURL('/feed');

    // Registrar segundo usuário
    await page2.goto('/auth');
    await page2.click('text=Criar Conta');
    await page2.fill('[data-testid="name-input"]', 'User Two');
    await page2.fill('[data-testid="email-input"]', 'user2@example.com');
    await page2.fill('[data-testid="password-input"]', 'SecurePass123');
    await page2.click('button:has-text("Criar Conta")');
    await expect(page2).toHaveURL('/feed');

    // User1 busca por User2
    await page1.goto('/amigos');
    await page1.fill('[data-testid="search-input"]', 'user2@example.com');
    await page1.press('[data-testid="search-input"]', 'Enter');

    // User1 envia solicitação de amizade
    await page1.click('[data-testid="add-friend-button"]');
    await expect(page1.locator('[data-testid="success-message"]')).toContainText('Solicitação enviada');

    // User2 vê a solicitação
    await page2.goto('/amigos');
    await page2.click('[data-testid="pending-requests-tab"]');
    await expect(page2.locator('[data-testid="request-item"]')).toContainText('User One');

    // User2 aceita a solicitação
    await page2.click('[data-testid="accept-request-button"]');
    await expect(page2.locator('[data-testid="success-message"]')).toContainText('Solicitação aceita');

    // Verificar se aparecem nas listas de amigos
    await page1.reload();
    await expect(page1.locator('[data-testid="friends-list"]')).toContainText('User Two');

    await page2.reload();
    await expect(page2.locator('[data-testid="friends-list"]')).toContainText('User One');

    await context1.close();
    await context2.close();
  });
});
```

## Scripts de Teste

### 1. Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:backend": "cd backend && npm run test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:backend && npm run test && npm run test:e2e"
  }
}
```

### 2. CI Test Script
```bash
#!/bin/bash
# scripts/run-tests.sh

set -e

echo "🧪 Running all tests..."

# Setup test environment
echo "📋 Setting up test environment..."
export NODE_ENV=test
export DATABASE_URL="postgresql://test_user:test_password@localhost:5432/study_space_test"

# Start test database
docker-compose -f docker-compose.test.yml up -d database
sleep 5

# Run backend tests
echo "🔧 Running backend tests..."
cd backend
npm run migrate
npm run test -- --coverage
cd ..

# Run frontend tests
echo "⚛️ Running frontend tests..."
npm run test:coverage

# Run E2E tests
echo "🌐 Running E2E tests..."
npm run build
npm run preview &
PREVIEW_PID=$!
sleep 10

npm run test:e2e

# Cleanup
kill $PREVIEW_PID
docker-compose -f docker-compose.test.yml down

echo "✅ All tests passed!"
```

## Quality Gates

### 1. Coverage Requirements
```javascript
// Configuração de cobertura mínima
const coverageThreshold = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  // Exigências específicas por arquivo crítico
  './src/contexts/AuthContext.tsx': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  './backend/src/controllers/auth.js': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  }
};
```

### 2. Performance Testing
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load feed page in less than 2 seconds', async ({ page }) => {
    // Login primeiro
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123');
    
    const startTime = Date.now();
    await page.click('button:has-text("Entrar")');
    await page.waitForSelector('[data-testid="feed-content"]');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/feed');

    // Avaliar performance
    const performance = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.value;
            }
            if (entry.name === 'first-input-delay') {
              vitals.fid = entry.value;
            }
            if (entry.name === 'cumulative-layout-shift') {
              vitals.cls = entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });

    // Verificar limites do Core Web Vitals
    if (performance.lcp) expect(performance.lcp).toBeLessThan(2500);
    if (performance.fid) expect(performance.fid).toBeLessThan(100);
    if (performance.cls) expect(performance.cls).toBeLessThan(0.1);
  });
});
```

### 3. Accessibility Testing
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any accessibility violations on login page', async ({ page }) => {
    await page.goto('/auth');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth');

    // Navegar usando apenas teclado
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Entrar")')).toBeFocused();

    // Testar ativação com Enter
    await page.keyboard.press('Enter');
    // Deve mostrar validação
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

## Melhores Práticas

### 1. Test Organization
- **AAA Pattern**: Arrange, Act, Assert
- **Test isolation**: cada teste independente
- **Descriptive names**: nomes claros e específicos
- **Single responsibility**: um conceito por teste

### 2. Test Data Management
- **Fixtures**: dados de teste padronizados
- **Factories**: criação dinâmica de dados
- **Cleanup**: limpeza entre testes
- **Seed data**: dados consistentes

### 3. Flaky Tests Prevention
- **Explicit waits**: aguardar elementos específicos
- **Stable selectors**: usar data-testid
- **Retry logic**: para testes instáveis
- **Environment isolation**: ambientes dedicados

---

**Última atualização:** Agosto 2025  
**Versão:** 1.0