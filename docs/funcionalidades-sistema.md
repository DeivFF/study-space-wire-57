# Funcionalidades e Regras de Negócios do Sistema

Este documento descreve as funcionalidades implementadas no sistema de estudo, baseado na análise completa do código-fonte frontend e backend.

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Autenticação e Gestão de Usuários](#autenticação-e-gestão-de-usuários)
3. [Sistema de Posts e Feed](#sistema-de-posts-e-feed)
4. [Sistema de Questões e Exercícios](#sistema-de-questões-e-exercícios)
5. [Sistema de Amizades e Conexões](#sistema-de-amizades-e-conexões)
6. [Sistema de Salas de Estudo](#sistema-de-salas-de-estudo)
7. [Sistema de Mensagens e Chat](#sistema-de-mensagens-e-chat)
8. [Sistema de Notificações](#sistema-de-notificações)
9. [Gamificação](#gamificação)

---

## Visão Geral do Sistema

O sistema é uma **plataforma de estudo colaborativa** que combina funcionalidades de rede social educativa com ferramentas de estudo. Possui arquitetura full-stack com:

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Comunicação em tempo real**: Socket.io
- **Autenticação**: JWT + localStorage
- **UI**: Radix UI + Tailwind CSS

---

## Autenticação e Gestão de Usuários

### Funcionalidades Implementadas

#### 1. Registro de Usuários
- **Endpoint**: `POST /api/auth/register`
- **Campos obrigatórios**: email, senha, nome
- **Validação**: Email único, senha com critérios mínimos
- **Processo**:
  - Hash da senha com bcrypt (12 rounds)
  - Criação automática de perfil com nickname único
  - Login automático após registro
  - Geração imediata de tokens JWT

#### 2. Login e Autenticação
- **Endpoint**: `POST /api/auth/login`
- **Proteção contra ataques**:
  - Rate limiting (5 tentativas por 15 minutos)
  - Rastreamento de tentativas de login
  - Bloqueio temporário após tentativas excessivas
- **Tokens**: JWT com expiração de 24h
- **Persistência**: localStorage para manter sessão

#### 3. Sistema de Perfis
- **Tabela**: `profiles`
- **Campos**:
  - `nickname`: Identificador único obrigatório
  - `first_name`, `last_name`: Nome completo
  - `avatar_url`: URL da foto de perfil
  - `bio`: Descrição pessoal
  - `city`: Localização
  - `interests`: Interesses do usuário
  - Configurações de privacidade

#### 4. Onboarding
- **Processo obrigatório** após registro
- **Modal automático** para usuários não completados
- **Campos**: nickname personalizado, avatar opcional
- **Endpoint**: `POST /api/profile/onboarding`

#### 5. Gestão de Senhas
- **Reset de senha**: Sistema completo com tokens únicos
- **Expiração**: Tokens válidos por 1 hora
- **Segurança**: Revogação de todas as sessões após reset

### Regras de Negócios

1. **Unicidade de email**: Cada email pode ter apenas uma conta
2. **Nickname único**: Sistema gera nicknames únicos automaticamente
3. **Verificação de email**: Implementada mas desabilitada (users.email_verified = true por padrão)
4. **Onboarding obrigatório**: Usuários devem completar o perfil antes de usar o sistema
5. **Sessão persistente**: Tokens salvos em localStorage para manter login
6. **Expiração de token**: Logout automático após 24h ou token inválido

---

## Sistema de Posts e Feed

### Tipos de Posts Implementados

#### 1. Publicação (`publicacao`)
- Post simples com título e conteúdo
- Suporte a tags para categorização
- Sistema de likes e comentários

#### 2. Dúvida (`duvida`)
- Posts de perguntas da comunidade
- Mesmo formato de publicação
- Diferenciação visual no frontend

#### 3. Exercício (`exercicio`)
- Posts com exercícios práticos
- **Campos específicos**:
  - `tipo_exercicio`: múltipla escolha, dissertativa, prática
  - `nivel_dificuldade`: fácil, médio, difícil
  - `options`: Array de opções para múltipla escolha
  - `correct_answer`: Resposta correta
- **Sistema de respostas**: Tabela `exercise_responses`

#### 4. Desafio (`desafio`)
- Exercícios com prazos e competição
- **Campos específicos**:
  - `deadline`: Data limite para respostas
  - `reward_points`: Pontos de recompensa
  - `max_attempts`: Limite de tentativas

#### 5. Enquete (`enquete`)
- Sistema de votação da comunidade
- **Campos específicos**:
  - `poll_options`: Array de opções
  - `poll_duration`: Duração em horas
  - `allow_multiple`: Permitir múltiplas escolhas
- **Sistema de votos**: Tabela `poll_votes`

### Funcionalidades do Feed

#### 1. Feed Personalizado
- **Endpoint**: `GET /api/posts/feed`
- Exibe posts de usuários conectados (amigos)
- Ordenação por data de criação (mais recentes primeiro)
- Suporte a paginação infinita

#### 2. Interações
- **Likes**: Sistema completo com contadores
- **Comentários**: Sistema hierárquico implementado
- **Compartilhamento**: Estrutura preparada

#### 3. Filtros Avançados
- **Por tipo**: publicacao, duvida, exercicio, desafio, enquete
- **Por tags**: Sistema de busca por tags
- **Por categoria**: Filtros por matéria/assunto
- **Por dificuldade**: Para exercícios e desafios

### Regras de Negócios

1. **Criação de posts**: Usuários autenticados podem criar qualquer tipo de post
2. **Posts anônimos**: Opção disponível (campo `is_anonymous`)
3. **Validação de conteúdo**: Sanitização automática de HTML
4. **Rate limiting**: Proteção contra spam na criação
5. **Permissões**: Usuários só podem editar/deletar próprios posts
6. **Estatísticas**: Contadores automáticos de likes e comentários

---

## Sistema de Questões e Exercícios

### Funcionalidades Implementadas

#### 1. Banco de Questões
- **Tabela**: `questions`
- **Categorias suportadas**: ENEM, OAB, Concursos
- **Campos**:
  - `category`: Categoria principal (ENEM, OAB, etc.)
  - `subcategory`: Subcategoria específica
  - `title`, `content`: Enunciado da questão
  - `year`: Ano da prova
  - `institution`: Instituição organizadora
  - `difficulty`: Nível de dificuldade
  - `subject_area`: Área do conhecimento

#### 2. Opções de Resposta
- **Tabela**: `question_options`
- **Campos**:
  - `option_letter`: A, B, C, D, E
  - `content`: Texto da opção
  - `is_correct`: Flag de resposta correta
  - `explanation`: Explicação da resposta

#### 3. Sistema de Resolução
- **Cronômetro global**: Tempo total da sessão
- **Cronômetro por questão**: Tempo individual
- **Estados de questão**: não iniciada, em andamento, respondida
- **Controle de sessão**: iniciar, pausar, parar

#### 4. Estatísticas e Histórico
- **Tabela**: `user_question_stats`
- **Métricas**:
  - Taxa de acerto por usuário
  - Tempo médio por questão
  - Histórico de respostas
  - Questões favoritas

#### 5. Filtros de Questões
- **Por categoria**: ENEM, OAB, Concursos
- **Por ano**: Filtro por período
- **Por instituição**: Banca organizadora
- **Por dificuldade**: Fácil, médio, difícil
- **Por área**: Matérias específicas

### Regras de Negócios

1. **Uma resposta por usuário**: Constraint unique na tabela de estatísticas
2. **Cronometragem obrigatória**: Tempo registrado para cada questão
3. **Sessões controladas**: Usuário deve iniciar sessão para responder
4. **Histórico permanente**: Todas as respostas são registradas
5. **Favoritos únicos**: Um usuário não pode favoritar a mesma questão duas vezes
6. **Estatísticas em tempo real**: Cálculo automático de taxas de erro

---

## Sistema de Amizades e Conexões

### Funcionalidades Implementadas

#### 1. Solicitações de Amizade
- **Tabela**: `user_connections`
- **Estados**: pending, accepted, rejected
- **Sistema bidirecional**: requester → receiver

#### 2. Busca de Usuários
- **Endpoint**: `GET /api/users/search`
- **Busca por**: nome, nickname, email
- **Filtros**: usuarios online, amigos comuns

#### 3. Gestão de Amizades
- **Aceitar/rejeitar**: Solicitações pendentes
- **Remover amizade**: Desfazer conexão
- **Bloquear usuários**: Funcionalidade preparada

#### 4. Interface de Amigos
- **Abas organizadas**:
  - Lista de amigos atuais
  - Solicitações pendentes (recebidas)
  - Busca de novos amigos
- **Status online**: Integração com WebSocket
- **Contadores**: Total de amigos, amigos online, solicitações

### Regras de Negócios

1. **Reciprocidade**: Amizade é uma relação bidirecional
2. **Unicidade**: Um usuário não pode enviar múltiplas solicitações para o mesmo receptor
3. **Estados mutuamente exclusivos**: pending, accepted ou rejected
4. **Notificações automáticas**: Sistema integrado com WebSocket
5. **Privacidade**: Usuários podem definir perfil como privado

---

## Sistema de Salas de Estudo

### Funcionalidades Implementadas

#### 1. Criação de Salas
- **Tabela**: `rooms`
- **Tipos**: pública, privada
- **Código único**: Formato #ABC1 (3-4 caracteres)
- **Gestão**: owner, moderadores, membros

#### 2. Sistema de Membros
- **Tabela**: `room_members`
- **Roles**: owner, moderator, member
- **Permissões diferenciadas**: Por role
- **Controle de acesso**: Baseado na visibilidade

#### 3. Convites e Acesso
- **Convites diretos**: Tabela `room_invitations`
- **Links de convite**: Tabela `room_invite_links`
- **Solicitações de acesso**: Para salas privadas
- **Expiração automática**: Convites com prazo

#### 4. Chat Integrado
- **Uma conversa por sala**: Tabela `room_conversations`
- **Mensagens em tempo real**: WebSocket
- **Histórico persistente**: Todas as mensagens salvas

#### 5. Moderação
- **Tabela**: `room_moderation_logs`
- **Ações**: kick, mute, promote, demote
- **Auditoria**: Log completo de ações
- **Permissões**: Apenas owners e moderadores

### Regras de Negócios

1. **Um owner por sala**: Constraint única na base
2. **Códigos únicos**: Formato específico e geração automática
3. **Hierarquia de permissões**: owner > moderator > member
4. **Convites com expiração**: 7 dias por padrão
5. **Limite de uso**: Links de convite com controle de uso
6. **Salas ativas**: Flag para desativar sem deletar
7. **Chat exclusivo**: Uma conversa por sala

---

## Sistema de Mensagens e Chat

### Funcionalidades Implementadas

#### 1. Conversas Privadas
- **Tabela**: `conversations`
- **Participantes**: Tabela `conversation_participants`
- **Mensagens**: Tabela `messages`

#### 2. Tipos de Mensagem
- **text**: Mensagens de texto simples
- **image**: Imagens com upload
- **file**: Arquivos diversos
- **system**: Mensagens automáticas

#### 3. Funcionalidades Avançadas
- **Respostas**: Reply a mensagens específicas
- **Reações**: Emojis nas mensagens
- **Status de leitura**: Quem viu cada mensagem
- **Indicadores de digitação**: Em tempo real

#### 4. WebSocket Integration
- **Eventos em tempo real**: Todas as interações
- **Salas por conversa**: join/leave automático
- **Status online**: Usuários conectados
- **Notificações**: Push em tempo real

### Regras de Negócios

1. **Conversas sempre ativas**: Não podem ser deletadas, apenas arquivadas
2. **Mensagens imutáveis**: Apenas soft delete
3. **Participação obrigatória**: Usuário deve estar na conversa para enviar mensagens
4. **Reações únicas**: Um usuário, uma reação por mensagem
5. **Leitura rastreada**: Timestamp de leitura por usuário
6. **Arquivos com limite**: Controle de tamanho e tipo

---

## Sistema de Notificações

### Funcionalidades Implementadas

#### 1. Tipos de Notificação
- **friend_request**: Solicitações de amizade
- **friend_accepted**: Amizade aceita
- **post_like**: Like em post
- **post_comment**: Comentário em post
- **room_invitation**: Convite para sala
- **message**: Nova mensagem

#### 2. Entrega de Notificações
- **Push em tempo real**: Via WebSocket
- **Persistência**: Salvas na base de dados
- **Status de leitura**: Lidas/não lidas
- **Expiração automática**: Limpeza periódica

#### 3. Configurações
- **Por tipo**: Usuário pode desabilitar tipos
- **Por canal**: Push, email (preparado)
- **Horários**: Configuração de não perturbar

### Regras de Negócios

1. **Notificações persistentes**: Salvas mesmo se usuário offline
2. **Deduplicação**: Evita notificações duplicadas
3. **Auto-limpeza**: Notificações antigas removidas automaticamente
4. **Configuração granular**: Por tipo e canal
5. **Rate limiting**: Evita spam de notificações

---

## Gamificação

### Funcionalidades Preparadas

#### 1. Sistema de Pontos
- **Exercícios corretos**: Pontos por acerto
- **Desafios**: Pontuação especial
- **Participação**: Pontos por atividade
- **Streaks**: Sequências de estudo

#### 2. Conquistas/Badges
- **Estrutura preparada**: Sistema de badges
- **Critérios variados**: Por atividade, tempo, performance
- **Níveis progressivos**: Bronze, prata, ouro

#### 3. Rankings
- **Global**: Todos os usuários
- **Por categoria**: Por matéria/área
- **Temporal**: Diário, semanal, mensal

### Regras de Negócios

1. **Pontuação justa**: Baseada em dificuldade e tempo
2. **Conquistas únicas**: Um badge por conquista
3. **Rankings dinâmicos**: Atualizados em tempo real
4. **Retroatividade**: Conquistas aplicadas a atividades passadas

---

## Observações Técnicas

### Segurança
- **Validação rigorosa**: Todos os inputs validados
- **Rate limiting**: Em todos os endpoints críticos
- **Sanitização**: Conteúdo HTML limpo automaticamente
- **CORS configurado**: Para ambiente de produção
- **Helmet.js**: Cabeçalhos de segurança

### Performance
- **Índices otimizados**: Todas as consultas indexadas
- **Paginação**: Implementada em listagens
- **Cache**: Estratégias de cache preparadas
- **Lazy loading**: Carregamento sob demanda

### Escalabilidade
- **Microserviços**: Arquitetura preparada para divisão
- **WebSocket**: Suporte a múltiplas instâncias
- **Database**: PostgreSQL com otimizações
- **Monitoramento**: Logs estruturados

---

## Status de Desenvolvimento

### ✅ Implementado e Funcional
- Sistema de autenticação completo
- CRUD de posts com todos os tipos
- Sistema de questões com cronômetro
- Chat em tempo real
- Sistema de salas básico
- Notificações WebSocket

### 🚧 Parcialmente Implementado
- Gamificação (estrutura pronta, lógica pendente)
- Upload de arquivos (estrutura pronta)
- Sistema de moderação (básico implementado)

### ❌ Planejado mas Não Implementado
- Sistema de videoconferência
- Integração com calendário
- Análise avançada de performance
- Sistema de relatórios
- Mobile app (PWA estrutura existe)

---

*Documento gerado através de análise completa do código-fonte. Última atualização: Dezembro 2024*