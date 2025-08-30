# Configuração e Setup

## Requisitos do Sistema

### Software Necessário

#### Frontend

- **Node.js**: versão 18+ (recomendado 20+)
- **npm**: versão 8+ (incluído com Node.js)
- **Git**: para controle de versão

#### Backend

- **Node.js**: versão 18+ (recomendado 20+)
- **PostgreSQL**: versão 13+ (recomendado 15+)
- **Bun**: para gerenciamento de pacotes do backend

### Verificação de Requisitos

```bash
# Verificar versões instaladas
node --version    # deve retornar v18+
npm --version     # deve retornar 8+
git --version     # qualquer versão recente
psql --version    # deve retornar 13+
bun --version     # deve retornar 1+
```

## Instalação e Configuração

### 1. Clone do Repositório

```bash
git clone <url-do-repositorio>
cd study-space-wire-57-main
```

### 2. Configuração do Frontend

#### Instalação de Dependências

```bash
# Na raiz do projeto
npm install
```

#### Variáveis de Ambiente (Frontend)

O frontend não requer arquivo `.env` específico, mas utiliza as seguintes configurações padrão:

- **Porta de Desenvolvimento**: 8080
- **API Base URL**: http://localhost:3002/api

### 3. Configuração do Backend

#### Instalação de Dependências

```bash
cd backend
npm install
# ou com bun
bun install
```

#### Configuração do Banco de Dados

1. **Instalar PostgreSQL**

   - Windows: Download do site oficial
   - macOS: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`

2. **Iniciar o Serviço PostgreSQL**

   ```bash
   # macOS/Linux
   sudo service postgresql start

   # Windows
   # Inicia automaticamente ou via Services
   ```

3. **Criar Banco de Dados**

   ```bash
   # Conectar ao PostgreSQL
   psql -U postgres

   # Criar database
   CREATE DATABASE azurk;

   # Sair
   \\q
   ```

#### Variáveis de Ambiente (Backend)

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Configure as variáveis no arquivo `.env`:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=azurk
DB_USER=postgres
DB_PASSWORD=admin123

# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=sua-chave-secreta-super-forte-aqui
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Configuration (opcional para desenvolvimento)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_FROM=noreply@studyspace.com

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Migrações do Banco de Dados

Execute as migrações para criar a estrutura do banco:

```bash
cd backend
bun run migrate
```

### 5. Teste da Configuração

#### Testar Conexão com o Banco

```bash
cd backend
bun run test-connection
```

#### Iniciar Servidores de Desenvolvimento

**Terminal 1 - Backend:**

```bash
cd backend
bun run dev
```

_Servidor rodará em: http://localhost:3002_

**Terminal 2 - Frontend:**

```bash
# Na raiz do projeto
npm run dev
```

_Aplicação rodará em: http://localhost:8080_

## Comandos de Desenvolvimento

### Frontend

| Comando             | Descrição                                        |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Inicia servidor de desenvolvimento na porta 8080 |
| `npm run build`     | Build de produção                                |
| `npm run build:dev` | Build de desenvolvimento                         |
| `npm run lint`      | Executa ESLint                                   |
| `npm run preview`   | Preview do build de produção                     |

### Backend

| Comando                   | Descrição                                        |
| ------------------------- | ------------------------------------------------ |
| `bun run dev`             | Inicia servidor de desenvolvimento na porta 3002 |
| `bun run migrate`         | Executa migrações do banco de dados              |
| `bun run clear-users`     | Limpa todos os usuários do banco                 |
| `bun run test-connection` | Testa conectividade com o banco                  |
| `bun run test`            | Executa testes Jest                              |

## Configurações Específicas

### Configuração do Vite

O arquivo `vite.config.ts` contém as seguintes configurações:

```typescript
export default defineConfig({
  server: {
    host: "0.0.0.0", // Permite acesso externo
    port: 8080, // Porta padrão
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias
    },
  },
});
```

### Configuração do Tailwind CSS

Sistema de cores personalizadas definido em `tailwind.config.ts`:

- **Cores Padrão**: primary, secondary, accent
- **Cores da Aplicação**: app-bg, app-panel, app-text
- **Cores do Sidebar**: sidebar-background, sidebar-primary
- **Dark Mode**: Suporte via classe

### Configuração do TypeScript

Configuração strict habilitada para maior segurança de tipos:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Path Mapping

Configurado alias `@/` que aponta para `./src/`:

```typescript
// ✅ Import com alias
import { Button } from "@/components/ui/button";

// ❌ Import relativo longo
import { Button } from "../../../components/ui/button";
```

## Configuração de Produção

### Variáveis de Ambiente - Produção

```env
# Database - Use valores reais
DB_HOST=seu-host-postgres.com
DB_USER=usuario_producao
DB_PASSWORD=senha_super_forte

# JWT - Use chaves únicas e fortes
JWT_SECRET=chave-jwt-extremamente-segura-256-bits

# Email - Configure SMTP real
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha-app

# Security - Valores mais restritivos
NODE_ENV=production
RATE_LIMIT_MAX_REQUESTS=50
```

### Build de Produção

```bash
# Frontend
npm run build

# Backend
# Não requer build específico, usa Node.js diretamente
NODE_ENV=production node src/server.js
```

## Solução de Problemas

### Problemas Comuns

#### "Cannot connect to database"

1. Verifique se PostgreSQL está rodando
2. Confirme credenciais no `.env`
3. Teste conexão: `bun run test-connection`

#### "Port 8080 already in use"

1. Pare outros serviços na porta 8080
2. Ou altere a porta em `vite.config.ts`

#### "Module not found"

1. Execute `npm install` na raiz
2. Execute `bun install` na pasta backend
3. Verifique path aliases em imports

#### Erro de CORS

1. Verifique se `FRONTEND_URL` no backend está correto
2. Confirme que frontend está rodando na porta esperada

### Logs e Debug

#### Frontend

- DevTools do navegador
- Console logs automáticos em desenvolvimento
- React DevTools extension

#### Backend

- Logs aparecem no terminal
- Use `console.log` para debug
- Configure nível de log em produção

### Reset Completo

Se tudo falhar, execute reset completo:

```bash
# Limpar dependências
rm -rf node_modules
rm -rf backend/node_modules

# Reinstalar
npm install
cd backend && bun install

# Reset do banco
cd backend
bun run clear-users
bun run migrate

# Restart servers
bun run dev  # backend
npm run dev  # frontend (em outro terminal)
```

## Próximos Passos

Após configuração completa:

1. **Teste a aplicação**: Acesse http://localhost:8080
2. **Crie uma conta**: Use o formulário de registro
3. **Explore as funcionalidades**: Feed, perfil, conexões
4. **Leia a documentação**: Consulte outros arquivos desta pasta
5. **Configure IDE**: VS Code com extensões React/TypeScript
