# DevOps Engineer Agent 🚀

## Especialização
Infraestrutura, deploy, CI/CD, containerização, monitoramento e operações para aplicações full-stack Node.js + React com PostgreSQL.

## Contexto do Projeto Study Space

### Stack de Infraestrutura Atual
- **Frontend**: React 18 + Vite (desenvolvimento na porta 8080)
- **Backend**: Node.js + Express + Bun (desenvolvimento na porta 3002)
- **Banco**: PostgreSQL com migrações customizadas
- **Desenvolvimento**: Ambiente local com hot reload
- **Produção**: Planejada (sem deploy ainda)

### Estrutura do Projeto
```
study-space-wire-57-main/
├── src/                    # Frontend React
├── backend/                # API Node.js
│   ├── src/               # Código do servidor
│   ├── migrations/        # Migrações SQL
│   └── scripts/           # Scripts utilitários
├── docs/                   # Documentação
├── package.json           # Frontend deps
└── backend/package.json   # Backend deps
```

## Containerização

### 1. Dockerfile - Backend
```dockerfile
# backend/Dockerfile
FROM oven/bun:1.1.29-alpine AS base
WORKDIR /app

# Instalar dependências
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copiar código fonte
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bun -u 1001
USER bun

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Comando de inicialização
CMD ["bun", "run", "src/server.js"]
```

### 2. Dockerfile - Frontend
```dockerfile
# Dockerfile (root)
FROM node:18-alpine AS build

# Build stage
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose - Desenvolvimento
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: study_space_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_user -d study_space_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_password@database:5432/study_space_dev
      - JWT_SECRET=your-dev-secret-key
      - CORS_ORIGIN=http://localhost:8080
    depends_on:
      database:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src:ro
      - ./backend/migrations:/app/migrations:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://localhost:3002/api
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 4. Docker Compose - Produção
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend_network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - database
      - redis
    networks:
      - backend_network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
    networks:
      - frontend_network
      - backend_network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend_network
    restart: unless-stopped

  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./ssl:/etc/nginx/certs
    restart: unless-stopped

networks:
  frontend_network:
  backend_network:

volumes:
  postgres_data:
  redis_data:
```

## CI/CD Pipeline

### 1. GitHub Actions - CI
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: study_space_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      working-directory: ./backend
      run: bun install
    
    - name: Run migrations
      working-directory: ./backend
      run: bun run migrate
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/study_space_test
    
    - name: Run tests
      working-directory: ./backend
      run: bun run test
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/study_space_test
        JWT_SECRET: test-secret-key

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run build
    
    - name: Run tests
      run: npm run test:ci

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'
```

### 2. GitHub Actions - CD
```yaml
# .github/workflows/cd.yml
name: CD Pipeline

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/backend:latest
          ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/frontend:latest
          ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to production
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USER }}
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /opt/study-space
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d --remove-orphans
          docker system prune -f
```

## Configurações de Servidor

### 1. Nginx - Produção
```nginx
# nginx.prod.conf
upstream backend {
    server backend:3002;
    keepalive 32;
}

server {
    listen 80;
    server_name studyspace.com www.studyspace.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name studyspace.com www.studyspace.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/studyspace.com.crt;
    ssl_certificate_key /etc/nginx/ssl/studyspace.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend - Static files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend - API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

### 2. Configuração do Sistema (Ubuntu)
```bash
#!/bin/bash
# scripts/setup-server.sh

# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar dependências
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    curl \
    git

# Configurar firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configurar fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configurar Docker
usermod -aG docker $USER
systemctl enable docker
systemctl start docker

# Criar diretório do projeto
mkdir -p /opt/study-space
cd /opt/study-space

# Configurar SSL com Let's Encrypt
certbot --nginx -d studyspace.com -d www.studyspace.com --non-interactive --agree-tos -m admin@studyspace.com

# Setup automated renewal
echo "0 3 * * * /usr/bin/certbot renew --quiet" >> /var/spool/cron/crontabs/root

echo "Server setup completed!"
```

## Monitoramento

### 1. Health Checks
```javascript
// backend/src/routes/health.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {}
  };
  
  try {
    // Database check
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    healthCheck.checks.database = {
      status: 'OK',
      responseTime: Date.now() - dbStart
    };
    
    // Memory check
    const memUsage = process.memoryUsage();
    healthCheck.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'OK' : 'WARNING',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.checks.database = {
      status: 'ERROR',
      error: error.message
    };
    res.status(503).json(healthCheck);
  }
});

// Liveness probe (simples)
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (com dependências)
router.get('/health/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: error.message 
    });
  }
});

export default router;
```

### 2. Logging com Winston
```javascript
// backend/src/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'study-space-backend',
    version: process.env.VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

// Console logging em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 3. Métricas com Prometheus
```javascript
// backend/src/middleware/metrics.js
import promClient from 'prom-client';

// Configurar métricas
const register = new promClient.Register();

// Métricas básicas do Node.js
promClient.collectDefaultMetrics({ register });

// Métricas customizadas
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections_total',
  help: 'Total number of active user connections'
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);

// Middleware para coletar métricas
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });
  
  next();
};

// Endpoint de métricas
export const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};
```

## Scripts de Deploy

### 1. Deploy Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENV=${1:-production}
VERSION=${2:-latest}

echo "🚀 Deploying Study Space to $ENV environment..."

# Validar parâmetros
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Configurar variáveis
COMPOSE_FILE="docker-compose.$ENV.yml"
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"

# Verificar se arquivo compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Compose file $COMPOSE_FILE not found"
    exit 1
fi

# Criar backup antes do deploy
echo "📦 Creating database backup..."
mkdir -p "$BACKUP_DIR"
docker-compose -f "$COMPOSE_FILE" exec -T database pg_dump \
    --host=localhost \
    --username=$POSTGRES_USER \
    --dbname=$POSTGRES_DB \
    --format=custom > "$BACKUP_DIR/pre_deploy_backup.dump"

# Pull das novas imagens
echo "⬇️ Pulling new images..."
docker-compose -f "$COMPOSE_FILE" pull

# Deploy com zero downtime
echo "🔄 Deploying new version..."
docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Aguardar serviços ficarem prontos
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🔍 Running health checks..."
for i in {1..30}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed, rolling back..."
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
    
    echo "Attempt $i/30 failed, retrying in 5s..."
    sleep 5
done

# Limpeza
echo "🧹 Cleaning up old images..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "📊 Service status:"
docker-compose -f "$COMPOSE_FILE" ps
```

### 2. Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENV=${1:-production}
BACKUP_FILE=${2}

echo "⏪ Rolling back Study Space in $ENV environment..."

COMPOSE_FILE="docker-compose.$ENV.yml"

# Parar serviços
echo "🛑 Stopping services..."
docker-compose -f "$COMPOSE_FILE" down

# Restaurar backup se fornecido
if [ -n "$BACKUP_FILE" ]; then
    echo "🔄 Restoring database from backup..."
    docker-compose -f "$COMPOSE_FILE" up -d database
    sleep 10
    
    docker-compose -f "$COMPOSE_FILE" exec -T database pg_restore \
        --host=localhost \
        --username=$POSTGRES_USER \
        --dbname=$POSTGRES_DB \
        --clean --if-exists \
        < "$BACKUP_FILE"
fi

# Subir versão anterior
echo "🚀 Starting previous version..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "✅ Rollback completed!"
```

## Segurança

### 1. Secrets Management
```yaml
# .env.example
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/study_space
POSTGRES_DB=study_space
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secure_random_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-256-bits-minimum
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://studyspace.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@studyspace.com
SMTP_PASS=app_specific_password

# Redis
REDIS_URL=redis://localhost:6379

# Production
NODE_ENV=production
PORT=3002
VERSION=1.0.0
```

### 2. Security Scanning
```bash
#!/bin/bash
# scripts/security-scan.sh

echo "🔍 Running security scans..."

# Scan de vulnerabilidades no código
npm audit --audit-level moderate

# Scan de vulnerabilidades nas imagens Docker
trivy image ghcr.io/study-space/backend:latest
trivy image ghcr.io/study-space/frontend:latest

# Scan de configuração Docker
hadolint backend/Dockerfile
hadolint Dockerfile

# Scan de secrets
git secrets --scan

echo "✅ Security scan completed!"
```

## Melhores Práticas

### 1. Performance
- **Multi-stage builds**: reduzir tamanho das imagens
- **Health checks**: monitoramento contínuo
- **Resource limits**: prevenir overconsumption
- **Caching**: otimizar build times

### 2. Segurança
- **Non-root users**: containers seguros
- **Secret management**: nunca commitar secrets
- **Network policies**: isolamento de serviços
- **Regular updates**: manter dependências atualizadas

### 3. Observabilidade
- **Structured logging**: JSON format
- **Metrics collection**: Prometheus/Grafana
- **Distributed tracing**: para debugging
- **Alerting**: notificações proativas

---

**Última atualização:** Agosto 2025  
**Versão:** 1.0