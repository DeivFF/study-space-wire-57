# Arquitetura do Projeto Study Space

## Visão Geral

O Study Space é uma aplicação full-stack construída com uma arquitetura moderna e escalável, separando claramente as responsabilidades entre frontend e backend.

## Estrutura Geral

```
study-space-wire-57-main/
├── src/                    # Frontend React
├── backend/                # API Node.js
├── docs/                   # Documentação
├── CLAUDE.md              # Instruções para desenvolvimento
└── package.json           # Configuração do frontend
```

## Frontend (React + TypeScript)

### Stack Tecnológico
- **Framework:** React 18 com TypeScript
- **Build Tool:** Vite
- **UI Library:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **Estado:** Context API + React Query
- **Roteamento:** React Router v6
- **Formulários:** React Hook Form + Zod

### Estrutura de Pastas

```
src/
├── components/             # Componentes reutilizáveis
│   ├── ui/                # Componentes base (shadcn/ui)
│   ├── Auth/              # Componentes de autenticação
│   ├── Feed/              # Componentes do feed
│   ├── StudyApp/          # Componentes de estudo
│   └── Community/         # Componentes de comunidades
├── contexts/              # Context providers
│   └── AuthContext.tsx    # Gerenciamento de autenticação
├── pages/                 # Páginas da aplicação
│   ├── Auth.tsx           # Página de login/registro
│   ├── Feed.tsx           # Feed principal
│   ├── Perfil.tsx         # Perfil do usuário
│   └── ...                # Outras páginas
├── lib/                   # Utilitários e configurações
└── App.tsx               # Componente raiz
```

### Arquitetura de Componentes

#### Hierarquia de Componentes
1. **App.tsx**: Configuração global (Providers, Router)
2. **Pages**: Páginas principais da aplicação
3. **Layout Components**: Estrutura comum (sidebars, headers)
4. **Feature Components**: Funcionalidades específicas
5. **UI Components**: Componentes base reutilizáveis

#### Padrões de Composição
- **Compound Components**: Para componentes complexos
- **Render Props**: Para lógica compartilhada
- **Custom Hooks**: Para estado e efeitos reutilizáveis

## Backend (Node.js + Express)

### Stack Tecnológico
- **Runtime:** Node.js
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL
- **ORM:** SQL nativo com migrations
- **Autenticação:** JWT + bcrypt
- **Validação:** Joi + express-validator
- **Segurança:** Helmet + CORS + Rate Limiting

### Estrutura de Pastas

```
backend/
├── src/
│   ├── config/            # Configurações (DB, etc.)
│   ├── controllers/       # Controladores da API
│   ├── middleware/        # Middlewares personalizados
│   ├── routes/            # Definição de rotas
│   ├── utils/             # Utilitários
│   └── server.js          # Servidor principal
├── migrations/            # Migrações do banco
├── scripts/               # Scripts utilitários
└── package.json          # Configuração do backend
```

### Arquitetura da API

#### Estrutura de Rotas
```
/api/
├── /auth                  # Autenticação
│   ├── POST /register     # Registro de usuário
│   ├── POST /login        # Login
│   ├── POST /refresh      # Refresh token
│   └── POST /logout       # Logout
├── /profile               # Perfil do usuário
│   ├── GET /              # Obter perfil
│   ├── PUT /              # Atualizar perfil
│   └── POST /avatar       # Upload de avatar
├── /connections           # Sistema de conexões
│   ├── GET /              # Listar conexões
│   ├── POST /send         # Enviar solicitação
│   └── POST /accept       # Aceitar solicitação
└── /notifications         # Notificações
    ├── GET /              # Listar notificações
    └── PUT /:id/read      # Marcar como lida
```

## Fluxo de Dados

### Autenticação
1. **Login**: Usuário envia credenciais → Backend valida → Retorna JWT
2. **Proteção**: Frontend armazena token → Envia em headers → Backend valida
3. **Refresh**: Token expira → Frontend renova automaticamente

### Estado da Aplicação
- **Local State**: React useState/useReducer para estado local
- **Global State**: Context API para autenticação e configurações
- **Server State**: React Query para cache e sincronização com API
- **Persistência**: localStorage para dados críticos (auth token)

### Comunicação Frontend-Backend
```
Frontend (React Query) ←→ API REST (Express) ←→ PostgreSQL
```

## Banco de Dados

### Estrutura Principal
- **users**: Dados dos usuários
- **user_connections**: Sistema de amizades
- **notifications**: Notificações do sistema
- **migrations_tracking**: Controle de versões do schema

### Padrões de Migration
- Arquivos numerados sequencialmente
- Rollback automático em caso de erro
- Versionamento controlado

## Segurança

### Frontend
- **HTTPS Only**: Produção sempre em HTTPS
- **Token Storage**: Armazenamento seguro de tokens
- **Route Protection**: Rotas protegidas por autenticação
- **Input Validation**: Validação client-side com Zod

### Backend
- **JWT Authentication**: Tokens com expiração
- **Password Hashing**: bcrypt para senhas
- **Rate Limiting**: Prevenção de ataques de força bruta
- **CORS**: Configuração restritiva de CORS
- **Helmet**: Headers de segurança
- **Input Validation**: Validação server-side com Joi

## Performance

### Frontend
- **Code Splitting**: Lazy loading de componentes
- **Memoização**: React.memo para componentes pesados
- **Virtual DOM**: React para updates eficientes
- **Bundle Optimization**: Vite para builds otimizados

### Backend
- **Connection Pooling**: Pool de conexões com PostgreSQL
- **Caching**: Cache em memória para dados frequentes
- **Compression**: Gzip para respostas HTTP
- **Query Optimization**: Índices e queries otimizadas

## Monitoramento e Logs

### Desenvolvimento
- **Console Logs**: Para debugging local
- **Error Boundaries**: Captura de erros no React
- **Hot Module Reload**: Desenvolvimento ágil

### Produção (Futuro)
- **Error Tracking**: Integração com Sentry
- **Performance Monitoring**: Métricas de performance
- **Health Checks**: Endpoints de saúde da API

## Escalabilidade

### Arquitetura Preparada Para
- **Horizontal Scaling**: Load balancers
- **Database Sharding**: Particionamento de dados
- **Microservices**: Separação de domínios
- **CDN**: Distribuição de assets estáticos

### Considerações de Design
- **Stateless Backend**: APIs sem estado para escalabilidade
- **Database Normalization**: Estrutura otimizada
- **Caching Strategy**: Múltiplas camadas de cache
- **API Versioning**: Versionamento para compatibilidade