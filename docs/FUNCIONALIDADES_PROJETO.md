# Funcionalidades do Projeto - Plataforma de Estudos

Este documento mapeia todas as funcionalidades existentes na plataforma de estudos, organizadas por áreas funcionais para facilitar a criação de testes CI/CD.

## 📋 Visão Geral do Sistema

**Tecnologias:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend:** Node.js + Express + Socket.io
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT + bcrypt
- **Tempo Real:** WebSocket (Socket.io)

---

## 🔐 1. Autenticação e Gerenciamento de Usuários

### 1.1 Sistema de Autenticação
- **Registro de usuário** com validação de email
- **Login/Logout** com persistência via localStorage
- **Verificação de email** com código de 6 dígitos
- **Recuperação de senha** com token por email
- **Renovação de tokens** (refresh token)
- **Proteção de rotas** (ProtectedRoute)
- **Rate limiting** para endpoints de auth
- **Expiração automática de token** com logout

### 1.2 Perfil de Usuário
- **Onboarding modal** para novos usuários
- **Gerenciamento de perfil** (nome, nickname, avatar)
- **Verificação de disponibilidade de nickname**
- **Upload de avatar** com processamento de imagem
- **Busca de usuários** por nome/interesses
- **Visualização de perfil público** por nickname
- **Estatísticas do usuário**

### 1.3 Tokens de Acesso
- **JWT com Bearer tokens**
- **Middleware de autenticação** em todas as rotas protegidas
- **Validação automática** de tokens expirados
- **Logout automático** em caso de token inválido

---

## 👥 2. Sistema Social e Conexões

### 2.1 Amizades e Conexões
- **Envio de solicitações de amizade**
- **Aceitação/Rejeição** de solicitações
- **Listagem de amigos** e conexões
- **Busca de usuários** para conexão
- **Remoção de amigos**
- **Bloqueio/Desbloqueio** de usuários
- **Notificações em tempo real** de solicitações

### 2.2 Feed Social
- **Feed personalizado** baseado em conexões
- **Diferentes tipos de posts:**
  - Publicação (texto/imagem)
  - Dúvida (pergunta com categoria)
  - Exercício (questão com alternativas)
  - Desafio (competição entre usuários)
  - Enquete (votação com opções)

### 2.3 Interações Sociais
- **Sistema de likes** em posts
- **Comentários** em posts com edição/exclusão
- **Votação em enquetes** com resultados em tempo real
- **Respostas a exercícios** com correção automática
- **Busca avançada** de posts por tipo/conteúdo
- **Filtros de conteúdo** por categoria

---

## 💬 3. Sistema de Mensagens e Chat

### 3.1 Conversas Privadas
- **Criação de conversas** entre usuários
- **Envio de mensagens** com suporte a texto e arquivo
- **Edição/Exclusão** de mensagens
- **Reações a mensagens** (emojis)
- **Marcação de mensagens como lidas**
- **Indicadores de digitação** em tempo real
- **Status online/offline** dos usuários

### 3.2 Chat de Salas de Estudo
- **Mensagens públicas** na sala
- **Indicadores de digitação** para salas
- **Moderação** de mensagens
- **Sistema de roles** (owner, moderator, member)

### 3.3 Widget de Chat Flutuante
- **Interface compacta** de chat
- **Alternância entre conversas**
- **Notificações visuais** de novas mensagens
- **Minimização/Maximização** do widget

---

## 🏠 4. Salas de Estudo

### 4.1 Gerenciamento de Salas
- **Criação de salas** públicas/privadas
- **Sistema de convites** com links
- **Solicitações de acesso** para salas privadas
- **Favoritar salas** para acesso rápido
- **Listagem de membros** com roles
- **Exclusão de salas** pelo owner

### 4.2 Moderação de Salas
- **Sistema de roles** (owner, moderator, member)
- **Ações de moderação** (kick, mute, promote)
- **Log de ações** de moderação
- **Aprovação/Rejeição** de solicitações de acesso

### 4.3 Funcionalidades da Sala
- **Chat em tempo real** com todos os membros
- **Compartilhamento de materiais**
- **Sessões de estudo colaborativo**
- **Estatísticas da sala** (membros, atividade)

---

## 📚 5. Sistema de Questões e Exercícios

### 5.1 Banco de Questões
- **Importação de questões** via CSV
- **Categorização** por área (ENEM, Concursos, etc.)
- **Filtros avançados** (categoria, ano, instituição, dificuldade)
- **Favoritar questões** para revisão
- **Estatísticas de desempenho** por usuário

### 5.2 Sessões de Questões
- **Modo de estudo individual** com cronômetro
- **Timer por questão** e global
- **Sistema de parada/continuação** de sessão
- **Resumo de sessão** com estatísticas
- **Botão flutuante** de parar sessão
- **Auto-avanço** para próxima questão

### 5.3 Sistema de Respostas
- **Seleção de alternativas** com validação
- **Feedback imediato** (correto/incorreto)
- **Explicações** das respostas corretas
- **Gamificação** com XP por acertos
- **Histórico de respostas** e desempenho

---

## 📖 6. Sistema de Estudos Organizados

### 6.1 Tipos de Estudo
- **Criação de categorias** de estudo personalizadas
- **Gerenciamento de tipos** de estudo
- **Organização hierárquica** (Tipo → Matéria → Aula)

### 6.2 Matérias
- **Criação de matérias** dentro de tipos de estudo
- **Organização de conteúdo** por matéria
- **Vinculação com aulas** e materiais

### 6.3 Aulas e Conteúdo
- **Criação de aulas** com título e descrição
- **Upload de arquivos** (PDF, vídeos, imagens)
- **Sistema de notas** para cada aula
- **Flashcards** para memorização
- **Exercícios personalizados** por aula
- **Log de atividades** de estudo

---

## 🗂️ 7. Gerenciamento de Arquivos

### 7.1 Upload de Arquivos
- **Suporte múltiplos formatos** (PDF, imagens, vídeos)
- **Validação de tipos** e tamanhos
- **Processamento de imagens** com Sharp
- **Armazenamento seguro** no servidor

### 7.2 Organização de Arquivos
- **Vinculação a aulas** específicas
- **Marcação como arquivo principal**
- **Status de estudo** (estudado/não estudado)
- **Download de arquivos** com autenticação

---

## 🃏 8. Sistema de Flashcards

### 8.1 Criação e Gerenciamento
- **Criação de flashcards** por aula
- **Sistema frente/verso** para memorização
- **Categorização** por matéria/aula
- **Edição/Exclusão** de flashcards

### 8.2 Sistema de Revisão Espaçada (SRS)
- **Algoritmo de repetição espaçada**
- **Flashcards devidos** para revisão
- **Sessões de estudo** com flashcards
- **Tracking de desempenho** e memorização

---

## 📝 9. Sistema de Notas

### 9.1 Gerenciamento de Notas
- **Criação de notas** por aula
- **Editor de texto rico** (se implementado)
- **Organização** por matéria/aula
- **Edição/Exclusão** de notas

### 9.2 Busca e Organização
- **Busca em notas** por conteúdo
- **Filtros** por aula/matéria
- **Sincronização** com sistema de estudos

---

## 🏆 10. Sistema de Gamificação

### 10.1 Sistema de XP
- **Ganho de XP** por ações (questões corretas, sessões completas)
- **Diferentes valores** de XP por tipo de ação
- **Tracking de progresso** do usuário

### 10.2 Conquistas e Achievements
- **Sistema de conquistas** desbloqueáveis
- **Verificação automática** de achievements
- **Notificações** de conquistas alcançadas
- **Diferentes tipos** de conquistas

---

## 🔔 11. Sistema de Notificações

### 11.1 Notificações em Tempo Real
- **Notificações WebSocket** para ações imediatas
- **Solicitações de amizade**
- **Mensagens de chat**
- **Atividades de salas**
- **Conquistas alcançadas**

### 11.2 Gerenciamento de Notificações
- **Listagem de notificações**
- **Contagem de não lidas**
- **Marcar como lida** individualmente
- **Marcar todas como lidas**
- **Exclusão de notificações**

---

## 📊 12. Sistema de Estatísticas

### 12.1 Estatísticas Pessoais
- **Desempenho em questões** por categoria
- **Tempo de estudo** por sessão
- **Taxa de acerto** geral e por área
- **Progresso ao longo do tempo**

### 12.2 Analytics de Atividade
- **Log de atividades** por aula/matéria
- **Tempo gasto** em cada conteúdo
- **Frequência de estudo**
- **Relatórios de desempenho**

---

## 📅 13. Sistema de Calendário

### 13.1 Agenda de Estudos
- **Planejamento de sessões** de estudo
- **Visualização em calendário**
- **Lembretes** de atividades
- **Sincronização** com progresso

---

## 🌐 14. Funcionalidades Tempo Real (WebSocket)

### 14.1 Comunicação em Tempo Real
- **Chat privado** instantâneo
- **Chat de salas** com múltiplos usuários
- **Indicadores de digitação**
- **Status online/offline**
- **Notificações push** de ações sociais

### 14.2 Eventos Síncronos
- **Atualizações de feed** em tempo real
- **Resultados de enquetes** dinâmicos
- **Notificações de amizade** instantâneas
- **Eventos de salas** (entrada/saída de membros)

---

## 🎨 15. Interface e UX

### 15.1 Componentes de UI
- **Design system** baseado em Radix UI
- **Tema claro/escuro** (se implementado)
- **Componentes reutilizáveis** (Button, Card, Dialog, etc.)
- **Sistema de toasts** para feedback
- **Loading states** em operações assíncronas

### 15.2 Navegação
- **Sidebar de navegação** principal
- **Command palette** para ações rápidas
- **Breadcrumbs** para localização
- **Roteamento** protegido por autenticação

### 15.3 Responsividade
- **Layout responsivo** para mobile/desktop
- **Componentes adaptativos** ao tamanho da tela
- **Touch-friendly** para dispositivos móveis

---

## 🔒 16. Segurança e Validação

### 16.1 Segurança Backend
- **Rate limiting** por endpoint
- **Validação de entrada** com Joi
- **Sanitização de dados** para posts
- **Headers de segurança** com Helmet
- **CORS** configurado adequadamente

### 16.2 Validação Frontend
- **Validação de formulários** com Zod
- **React Hook Form** para gerenciamento
- **Feedback visual** de erros
- **Prevenção de XSS** em conteúdo dinâmico

### 16.3 Autorização
- **Verificação de permissões** por recurso
- **Proteção de rotas** sensíveis
- **Verificação de ownership** de conteúdo
- **Bloqueio de usuários** maliciosos

---

## 🧪 17. Áreas para Testes CI/CD

### 17.1 Testes de Autenticação
- [ ] Registro e login de usuários
- [ ] Verificação de email
- [ ] Recuperação de senha
- [ ] Expiração e renovação de tokens
- [ ] Proteção de rotas

### 17.2 Testes de API
- [ ] Todos os endpoints CRUD
- [ ] Validação de dados de entrada
- [ ] Rate limiting
- [ ] Autenticação em rotas protegidas
- [ ] Respostas de erro apropriadas

### 17.3 Testes de Funcionalidades Sociais
- [ ] Sistema de amizades
- [ ] Criação e interação com posts
- [ ] Chat e mensagens
- [ ] Notificações em tempo real

### 17.4 Testes de Estudo
- [ ] Sistema de questões
- [ ] Sessões de estudo
- [ ] Flashcards e SRS
- [ ] Organização de conteúdo

### 17.5 Testes de Interface
- [ ] Renderização de componentes
- [ ] Interações do usuário
- [ ] Responsividade
- [ ] Estados de loading/erro

### 17.6 Testes de Integração
- [ ] Fluxo completo de registro → estudo
- [ ] Comunicação frontend ↔ backend
- [ ] WebSocket e tempo real
- [ ] Upload e download de arquivos

### 17.7 Testes de Performance
- [ ] Tempo de resposta das APIs
- [ ] Carregamento de páginas
- [ ] Otimização de queries do banco
- [ ] Uso de memória

### 17.8 Testes de Segurança
- [ ] Validação de entrada
- [ ] Proteção contra XSS/CSRF
- [ ] Rate limiting
- [ ] Autorização adequada

---

## 📦 18. Estrutura de Banco de Dados

### 18.1 Tabelas Principais
- **users** - Dados dos usuários
- **profiles** - Perfis estendidos
- **posts** - Sistema de posts sociais
- **conversations** - Conversas privadas
- **messages** - Mensagens de chat
- **rooms** - Salas de estudo
- **questions** - Banco de questões
- **study_types** - Tipos de estudo
- **subjects** - Matérias
- **lessons** - Aulas
- **flashcards** - Cartões de estudo
- **notifications** - Sistema de notificações

### 18.2 Relacionamentos
- **user_connections** - Amizades entre usuários
- **room_members** - Membros de salas
- **post_likes/comments** - Interações sociais
- **lesson_files/notes** - Conteúdo das aulas
- **user_question_stats** - Estatísticas de questões

---

## 🚀 19. Comandos de Desenvolvimento

### 19.1 Frontend
```bash
npm run dev          # Servidor de desenvolvimento (porta 8080)
npm run build        # Build para produção
npm run build:dev    # Build em modo desenvolvimento
npm run lint         # ESLint
npm run preview      # Preview do build
```

### 19.2 Backend
```bash
cd backend && bun run dev         # Servidor backend (porta 3002)
cd backend && bun run migrate     # Executar migrações
cd backend && bun run clear-users # Limpar usuários
cd backend && bun run test        # Testes Jest
```

### 19.3 Desenvolvimento Completo
```bash
npm run dev:both     # Frontend + Backend simultaneamente
```

---

Este documento serve como base para a criação de uma suíte abrangente de testes CI/CD, cobrindo todas as funcionalidades críticas da plataforma de estudos. Cada seção pode ser traduzida em casos de teste específicos para garantir a qualidade e estabilidade do sistema após mudanças no código.