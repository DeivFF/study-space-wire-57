1. Inventário & Mapeamento FE↔BE
   1.1 Inventário de Arquivos (anexos)
   Caminho / Arquivo Tipo Função/Descrição (relevante ao BE)
   /FeedAndRoomsPanel.tsx React/TSX Painel lateral com Feed e Salas, filtros “Minhas salas/Salas”, busca, toggle de favoritar e entrar na sala. Dispara onToggleFavorite(roomId) e onJoinRoom(room); ordena favoritas e públicas primeiro.
   /InviteModal.tsx React/TSX Modal para convidar usuários para uma sala. Abas “Disponíveis” e “Convidados”, busca de usuários, ações Convidar e Revogar convite (mock).
   /CreateRoomModal.tsx React/TSX Modal para criar sala (nome, descrição, visibilidade pública/privada). Gera code localmente (ex. #A1) — em produção deve ser gerado pelo servidor. Dispara onCreateRoom({...}).
   /EmptyRoomState.tsx React/TSX Estado vazio orientando a criar ou entrar numa sala; botão Criar Sala chama onCreateRoom().
   /MembersPanel.tsx React/TSX Lista membros (com isHost, status online), busca local, botão Adicionar membro (abre InviteModal) e Sair da sala.
   /ChatPanel.tsx React/TSX Chat de sala: lista mensagens, envia com Enter/Send, autoscroll; expõe onSendMessage. Indica “tempo real” (recomenda WebSocket).
   /StudyRoomHeader.tsx React/TSX Header da sala com Criar Sala, Convidar, Copiar link, Toggle tema; abre InviteModal. Exibe roomCode.
   /ss.txt SQL (dump PG) Dump PostgreSQL contendo users, profiles, conversations, messages, post\_\*, enums: invitation_status, invitation_type, access_request_status, room_visibility, room_member_role, moderation_action; functions de contagem de membros/transferência de ownership que se referem a rooms/room_members, mas tabelas não constam.

Atenção
O FE usa rótulos de visibilidade em pt-BR (“pública/privada”); no BE padronizaremos como public/private e retornaremos i18nLabels quando necessário.

Por que isso?

O inventário identifica pontos de integração e lacunas cedo, reduz retrabalho e acelera a definição dos contratos FE↔BE.

Alinhar nomenclaturas (ex. visibility) evita quebras e ambiguidade de payloads.

1.2 Mapa de Páginas/Componentes → Ações/Estados → Operações de Backend

Abaixo, para cada componente, listamos ações do usuário e operações BE necessárias, com endpoint, método, payloads, status/erros, auth e validações.

A) StudyRoomHeader — ações de topo da sala

Criar Sala (onCreateRoom)

Endpoint: POST /v1/rooms

Auth: Bearer <JWT>

Request (JSON):

{
"name": "Matemática — Álgebra Linear",
"description": "Estudos de matrizes e autovalores",
"visibility": "public",
"code": null
}

Nota: code é gerado no servidor (único, curto), ignorar client-side. FE originalmente gera #A1 apenas para mock.

Response 201 (JSON):

{
"id": "uuid-room",
"name": "Matemática — Álgebra Linear",
"description": "Estudos de matrizes e autovalores",
"visibility": "public",
"code": "#A1",
"ownerId": "uuid-user",
"currentMembers": 1,
"createdAt": "2025-08-30T16:00:00Z"
}

Status/Erros: 400 validação; 401 não autenticado; 409 conflito (nome já usado pelo mesmo owner? opcional); 422 visibilidade inválida; 500.

Validações (cliente): nome obrigatório, min 3, max 50; descrição max 200 (já no FE).

Validações (servidor): normalizar espaços, proibir nomes vazios, gerar code único, visibility ∈ {public, private}.

Convidar (abre InviteModal)

Endpoint: listagem de elegíveis → GET /v1/rooms/{roomId}/invitable-users?query=maria&limit=20

Endpoint: enviar convite → POST /v1/rooms/{roomId}/invites

{ "userId": "uuid-user", "type": "direct" }

Endpoint: revogar convite → DELETE /v1/rooms/{roomId}/invites/{inviteId}

Auth: owner/moderator da sala.

Status/Erros: 403 se não tiver papel; 404 sala/usuário/convite não encontrado; 409 já convidado; 410 convite expirado; 429 rate limit; 500.

Validações: não convidar quem já é membro; evitar spam (limite por hora).

Copiar Link (clipboard)

Sem BE (só gera/expõe link de convite ativo):

POST /v1/rooms/{roomId}/invite-links → cria/rotaciona link

GET /v1/rooms/{roomId}/invite-links/active → retorna URL curta

Validações: TTL, limite de usos, revogação.

Enums relevantes no dump**:** invitation_type, invitation_status, moderation_action (indício do modelo).

Toggle Tema

Sem BE (estado local/aria preferências).

B) CreateRoomModal — criação de sala (form)

Validações cliente: nome min 3/max 50; descrição max 200; visibilidade radio; botão “Criar Sala”.

Operação BE: igual ao item A.1.

Observação: FE hoje “simula” atraso e gera code; em produção, backend responde code.

Risco: aceitar code do cliente pode causar colisões/fraude. Mitigação: code somente server-side.

C) FeedAndRoomsPanel — lista de Feed/Salas

Listar minhas salas / salas (de que não sou dono)

Endpoint: GET /v1/rooms?filter=mine|all&search=&visibility=&favorite=&limit=20&cursor=

Auth: Bearer

Response 200 (exemplo simplificado):

{
"items": [
{ "id":"r1","name":"Cálculo I","visibility":"public","members":42,"isOwner":true,"isFavorite":true, "code":"#C7" }
],
"nextCursor": null
}

Ordenação: favoritas → públicas → nome (alfa), para refletir o FE.

Validações: filter ∈ {mine, all}; visibility ∈ {public, private}; search ≤ 64 chars.

Erros: 400 parâmetros; 401 auth; 429 rate.

Favoritar sala (estrela)

Endpoint: PATCH /v1/rooms/{id}/favorite (idempotente)

{ "favorite": true }

Status: 200 com estado atual; 404 se sala não encontrada ou sem membership; 409 se não for membro e política exigir.

Entrar na sala (onJoinRoom)

Pública: POST /v1/rooms/{id}/join → entra direto.

Privada:

via convite: POST /v1/rooms/{id}/invites/{inviteId}:accept

via solicitação de acesso: POST /v1/rooms/{id}/access-requests

Enums: access_request_status dá suporte ao fluxo de aprovação.

Feed (atividades)

Endpoint: GET /v1/feed?limit=... (pode agregar posts, moderation_logs, room_events).

Base no dump: há posts, post_comments, post_likes, poll_votes, etc. para social/feed.

D) InviteModal — buscar, convidar, revogar

Buscar usuários: GET /v1/users?query=ana&limit=20

Listar convidados pendentes: GET /v1/rooms/{roomId}/invites?status=pending

Convidar: POST /v1/rooms/{roomId}/invites

Revogar: DELETE /v1/rooms/{roomId}/invites/{inviteId}

Validações: não convidar na_sala; não duplicar pendente; limite de convites/hora.

Erros: 403 (sem papel); 404; 409 (já convidado); 410 (expirado).

Dica: retornar no payload um statusLabel (“convidado”, “na_sala”) e invitedAt pronto para UI.

E) MembersPanel — ver membros, adicionar (abre modal), sair

Listar membros: GET /v1/rooms/{roomId}/members?search=&limit=50

{ "items":[
{"id":"u1","name":"Maria Silva","initials":"MS","isOnline":true,"role":"owner","activity":"resolvendo questões"}
]}

Sair da sala: POST /v1/rooms/{roomId}/leave

Promover/Demover (opcional): POST /v1/rooms/{roomId}/members/{userId}:promote|:demote

Validações: owner não pode sair se for único owner → forçar transferência de ownership (há function no dump que transfere ao moderador mais antigo; se ninguém, desativa).

Erros: 403 sem permissão; 409 impedir remoção do último owner.

F) ChatPanel — mensagens e tempo real

Carregar mensagens: GET /v1/rooms/{roomId}/messages?cursor=&limit=50

Dump já possui conversations, messages, conversation_participants. Sugerimos cada sala ter uma conversation associada (Seção 2).

Enviar mensagem: POST /v1/rooms/{roomId}/messages

{ "content":"Olá, pessoal!" }

Tempo real: WebSocket /ws

Eventos: message:new, message:updated, message:deleted, typing, read.

AutZ: somente membros da sala.

Leituras: POST /v1/messages/{messageId}/reads

Reações: POST /v1/messages/{messageId}/reactions / DELETE (há message_reactions no dump).

Validações: tamanho de mensagem, anti-XSS (sanitize/escape), antiflood (rate-limit).

G) EmptyRoomState — CTA de criação/entrada

Criar sala → POST /v1/rooms (já coberto).

Entrar via seleção de sala no painel (já coberto).

1.3 Requisitos de Autenticação/Autorização (por operação)
Operação Auth AutZ (papéis)
Criar sala JWT obrigatório qualquer usuário ativo
Listar salas (mine/all) JWT ver all pode ser global; ver mine = membro/dono
Favoritar sala JWT membro da sala
Entrar em sala pública JWT permitido
Solicitar acesso a privada JWT permitido (cria access_request)
Aceitar convite JWT convidado ↔ convite válido
Convidar usuário JWT owner ou moderator
Revogar convite JWT owner ou moderator
Listar membros JWT membros da sala (ou público reduzido se pública)
Sair da sala JWT membro
Promover/demover JWT owner
Mensagens (listar/enviar) JWT membro da sala
Reações/leituras JWT membro da sala

Por que isso?
O FE distingue claramente funções de owner/moderator/member (badges/ações). O dump possui room_member_role enum, reforçando esses papéis — embora a tabela room_members não esteja no dump, vamos criá-la na Seção 2.

1.4 Validações (Cliente e Servidor)

Cliente (já presente em parte):

Nome da sala: min 3, max 50; descrição: max 200; auto-trim; seleção de visibilidade.

Busca (salas/usuários): sanitizada, limitada em comprimento.

Mensagens: tecla Enter (sem Shift) envia; bloqueio se vazio; max length (ex.: 4k chars).

Servidor:

visibility whitelist; code único por sala; proibir duplicidade de convite; impedir sair do último owner (usar regra de transferência do dump como fallback).

Rate limiting em envio de mensagens e convites; CORS estrito; schema validation (zod/class-validator).

1.5 Códigos de Status & Mensagens de Erro (padrões)
Situação Código Corpo (exemplo)
Criado 201 { "id":"...", "...": "..." }
Ok 200 { ... }
Sem conteúdo 204 (vazio)
Parâmetro inválido 400 { "error":"BadRequest", "details":[{"field":"name","msg":"min 3"}] }
Não autenticado 401 { "error":"Unauthorized" }
Proibido 403 { "error":"Forbidden", "msg":"role required: owner" }
Não encontrado 404 { "error":"NotFound", "resource":"room" }
Conflito 409 { "error":"Conflict", "msg":"already invited" }
Não processável 422 { "error":"UnprocessableEntity", "details":[...] }
Limite 429 { "error":"TooManyRequests" }
Erro interno 500 { "error":"InternalServerError", "traceId":"..." }

Dica: padronize traceId no response e nos logs estruturados (Seção 3).

1.6 Lacunas Detectadas & Soluções Propostas

Ausência de tabelas rooms e room_members no dump

Evidências: functions increment_room_members_count/decrement_room_members_count atualizam rooms.current_members; enum room_member_role; enum room_visibility. Conclusão: o schema alvo contempla salas, mas as tabelas não foram incluídas/geradas.

Solução: criar rooms, room_members, room_invitations, room_access_requests, room_moderation_logs, room_conversations (mapeia 1:1 com conversations já existentes).

FE gera code client-side (ex.: #A1)

Risco: colisão/abuso.

Solução: code gerado no BE (prefixo # + 2–4 chars Base36; unique index).

Chat de sala x modelo de messages

Situação: há conversations/messages (DMs/grupos), mas não há vínculo explícito com salas.

Solução: room_conversations(room_id UNIQUE, conversation_id UNIQUE) e usar conversation_participants para membros da sala (sincronizar ao entrar/sair).

Feed/Atividades

Situação: FE exibe “atividades” genéricas; no dump há posts, post_likes, post_comments, poll_votes.

Solução: endpoint /v1/feed agregando eventos (post criado/comentado, sala criada, membro entrou etc.), apoiado por room_moderation_logs com enum moderation_action.

Papeis & AutZ

Situação: FE mostra host/owner; dump traz enum room_member_role. Solução: adotar owner | moderator | member com regras claras (promover/demover, transferir).

Internacionalização de rótulos

Situação: FE usa “pública/privada”; padrão BE em inglês.

Solução: BE retorna visibility técnico e opcional labels localizados quando necessário.

Observabilidade

Situação: não definido.

Solução: incluir traceId nos headers/respostas, logs JSON, métricas (latência/erros) e tracing distribuído (OTel). (Detalhe na Seção 3.)

Risco: sem as tabelas de salas, endpoints ficarão acoplados a mocks.
Mitigação: implementar Seção 2 criando schema mínimo para rooms e relacionamentos.

1.7 Exemplos de Contratos por Caso de Uso Crítico

Criar sala

POST /v1/rooms
Authorization: Bearer <JWT>
Content-Type: application/json
{
"name": "Direito Administrativo",
"description": "Rumo à PRF",
"visibility": "private"
}

201

{
"id":"9e9c...","name":"Direito Administrativo","description":"Rumo à PRF",
"visibility":"private","code":"#K9","ownerId":"u123","currentMembers":1,
"createdAt":"2025-08-30T16:00:00Z"
}

Convidar usuário (direto)

POST /v1/rooms/{roomId}/invites
{
"userId":"u456","type":"direct"
}

201

{ "id":"inv789","status":"pending","expiresAt":"2025-09-01T00:00:00Z" }

Entrar em sala pública

POST /v1/rooms/{roomId}/join

200

{ "roomId":"...", "role":"member" }

Enviar mensagem

POST /v1/rooms/{roomId}/messages
{
"content":"Alguém tem o PDF da aula 02?"
}

201

{
"id":"m1","content":"Alguém tem o PDF da aula 02?","senderId":"u123",
"createdAt":"...", "roomId":"...", "conversationId":"..."
}

Por que isso?
Casos críticos validam o desenho de domínio (salas, convites, chat) e orientam implementação & testes de contrato.

1.8 Tabela-Resumo FE→BE (mapa rápido)
Componente FE Ação Endpoint Método AuthZ Observações
StudyRoomHeader Criar sala /v1/rooms POST user code server-side
StudyRoomHeader Convidar /v1/rooms/{id}/invites POST owner/mod direct/link
StudyRoomHeader Link ativo /v1/rooms/{id}/invite-links/active GET owner/mod TTL/uses
FeedAndRoomsPanel Listar salas `/v1/rooms?filter=mine	all...` GET user
FeedAndRoomsPanel Favoritar /v1/rooms/{id}/favorite PATCH membro idempotente
FeedAndRoomsPanel Entrar (pública) /v1/rooms/{id}/join POST user -
FeedAndRoomsPanel Acesso (privada) /v1/rooms/{id}/access-requests POST user workflow
InviteModal Buscar usuários /v1/users?query=... GET owner/mod -
InviteModal Listar convites /v1/rooms/{id}/invites?status=pending GET owner/mod -
InviteModal Revogar /v1/rooms/{id}/invites/{inviteId} DELETE owner/mod -
MembersPanel Listar membros /v1/rooms/{id}/members GET membro -
MembersPanel Sair da sala /v1/rooms/{id}/leave POST membro transf. owner
ChatPanel Listar msgs /v1/rooms/{id}/messages GET membro cursor
ChatPanel Enviar msg /v1/rooms/{id}/messages POST membro rate-limit
ChatPanel Reagir /v1/messages/{id}/reactions POST/DELETE membro no dump: table message_reactions
ChatPanel Ler msg /v1/messages/{id}/reads POST membro message_reads no dump

2. Design de Dados Completo (ER + SQL + Migrações)

Objetivo: derivar o modelo de dados a partir do comportamento do FE (salas, membros, convites, solicitações de acesso, chat e favoritos), documentar atributos/constraints/índices, relacionamentos e entregar ER (Mermaid) + SQL idempotente (PostgreSQL) + estratégia de versionamento.

2.1 Entidades Derivadas do Domínio (e por quê)
Entidade Para quê no FE Por que existe (ligação com caso de uso)
rooms Criar/listar salas, exibir code, visibilidade, contagem FE cria sala (CreateRoomModal) e lista no painel (FeedAndRoomsPanel). code curto para convite rápido; visibility (“public/private”) dita o fluxo de entrada.
room_members Listar membros, papéis, sair da sala, favoritos MembersPanel exibe papéis e status; FeedAndRoomsPanel permite favoritar; valida AutZ (owner/mod/member). Mantém current_members em rooms.
room_invitations Convidar usuários, revogar convite InviteModal executa Convidar/Revogar; status/expiração para UI (“pendente/expirado”).
room_invite_links Gerar/copiar link de convite StudyRoomHeader aciona “Copiar Link”; controla TTL e nº de usos.
room_access_requests Solicitar acesso a sala privada FeedAndRoomsPanel → “Entrar” em privada dispara solicitação e aguarda aprovação.
conversations/messages Chat por sala (lista/enviar msgs) ChatPanel precisa histórico e tempo real; cada room mapeia 1:1 para uma conversation via room_conversations.
message_reads Lido/entregue Para indicadores de leitura.
message_reactions Reações (👍, ❤️) Reagir no chat sem duplicidade por usuário+emoji.
room_moderation_logs Auditoria/Feed Alimenta Feed/observabilidade: convites, promoções, kicks, updates.
users (ref) FK de donos/membros/autores Integra com Auth; aqui usamos users(id uuid) como referência (pode apontar para schema de identidade).

Nota: Optamos por não gravar mensagens diretamente em rooms para permitir reuso do motor de chat (e.g. DM/Grupos) e escalar conversas sem acoplar à semântica de sala.

2.2 Entidades – Atributos, Tipos e Regras
rooms

Atributos:

id UUID PK

name TEXT NOT NULL (3..50)

description TEXT NULL (≤200)

visibility room_visibility NOT NULL DEFAULT 'public'

code TEXT NOT NULL UNIQUE (regex ^#[A-Z0-9]{2,4}$)

owner_id UUID NOT NULL (FK → users.id)

current_members INT NOT NULL DEFAULT 0 (mantido por trigger)

created_at TIMESTAMPTZ DEFAULT now()

updated_at TIMESTAMPTZ DEFAULT now()

Índices: UNIQUE(code), btree em (owner_id), GIN (name) com pg_trgm p/ busca.

Regras: pelo menos um owner por sala; code gerado no servidor.

room_members

Atributos:

room_id UUID FK, user_id UUID FK

role room_member_role NOT NULL DEFAULT 'member' (owner|moderator|member)

favorite BOOLEAN NOT NULL DEFAULT false

notifications_enabled BOOLEAN NOT NULL DEFAULT true

joined_at TIMESTAMPTZ DEFAULT now()

last_seen_at TIMESTAMPTZ NULL

PK: (room_id, user_id)

Índices: (user_id) p/ “Minhas salas”; parcial único garantindo no máx. 1 owner por sala: UNIQUE (room_id) WHERE role='owner'.

Triggers: incrementa/decrementa rooms.current_members; previne remoção do último owner.

room_invitations

Atributos:

id UUID PK, room_id UUID FK, inviter_id UUID FK, invitee_id UUID FK NULL (para type='link' fica NULL)

type invitation_type NOT NULL (direct|link)

status invitation_status NOT NULL DEFAULT 'pending' (pending|accepted|revoked|expired)

token TEXT UNIQUE NULL (para links)

expires_at TIMESTAMPTZ NULL

accepted_at / revoked_at TIMESTAMPTZ NULL

revoked_by UUID NULL

created_at TIMESTAMPTZ DEFAULT now()

Índices: (room_id, status), (invitee_id, status).

room_invite_links

Atributos:

id UUID PK, room_id UUID FK, created_by UUID FK

url_token TEXT UNIQUE NOT NULL

max_uses INT NULL, uses INT NOT NULL DEFAULT 0

expires_at TIMESTAMPTZ NULL, active BOOLEAN NOT NULL DEFAULT true

created_at TIMESTAMPTZ DEFAULT now()

Regras: invalida via active=false/expiração/limite.

room_access_requests

Atributos:

id UUID PK, room_id UUID FK, requester_id UUID FK

status access_request_status NOT NULL DEFAULT 'pending' (pending|approved|denied|cancelled)

created_at TIMESTAMPTZ DEFAULT now()

decided_at TIMESTAMPTZ NULL, decided_by UUID NULL

Índices: (room_id, status), (requester_id, status).

conversations, room_conversations

conversations:

id UUID PK, created_at, updated_at

room_conversations:

room_id UUID UNIQUE FK, conversation_id UUID UNIQUE FK

1:1 entre sala e conversa.

Motivo: separar domínio chat do domínio sala.

messages

Atributos:

id UUID PK, conversation_id UUID FK, sender_id UUID FK

content TEXT NOT NULL

edited BOOLEAN NOT NULL DEFAULT false

created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ NULL, deleted_at TIMESTAMPTZ NULL

Índices: (conversation_id, created_at DESC) p/ paginação por cursor.

message_reads

message_id UUID FK, user_id UUID FK, read_at TIMESTAMPTZ DEFAULT now()

PK: (message_id, user_id)

message_reactions

message_id UUID FK, user_id UUID FK, reaction VARCHAR(32), created_at TIMESTAMPTZ DEFAULT now()

PK: (message_id, user_id, reaction)

room_moderation_logs

Atributos:

id UUID PK, room_id UUID FK, actor_id UUID FK

action moderation_action NOT NULL (ex.: invite_create|invite_revoke|member_promote|member_demote|member_kick|message_delete|room_update)

target_user_id UUID NULL, message_id UUID NULL

reason TEXT NULL, created_at TIMESTAMPTZ DEFAULT now()

Índices: (room_id, created_at DESC)

2.3 Relacionamentos (cardinalidade, deleção, atualização)

users (1) —< rooms (N) via owner_id (ON DELETE RESTRICT): evite órfãos críticos.

rooms (1) —< room_members (N) (ON DELETE CASCADE): apagar sala remove membership.

users (1) —< room_members (N) (ON DELETE CASCADE): apagar usuário remove membership.

rooms (1) —< room_invitations (N) (CASCADE); users (1) —< room_invitations (N) por inviter_id/invitee_id (SET NULL em invitee_id se necessário).

rooms (1) —< room_invite_links (N) (CASCADE).

rooms (1) —< room_access_requests (N) (CASCADE).

rooms (1) — (1) conversations via room_conversations (CASCADE).

conversations (1) —< messages (N) (CASCADE).

messages (1) —< message_reads (N) (CASCADE).

messages (1) —< message_reactions (N) (CASCADE).

rooms (1) —< room_moderation_logs (N) (CASCADE).

Regra de deleção: CASCADE onde dados são exclusivamente filhos da sala; RESTRICT p/ dono da sala evita deleção acidental do owner.

2.4 Diagrama ER (Mermaid)
erDiagram
users ||--o{ rooms : "owner_id"
users ||--o{ room_members : ""
rooms ||--o{ room_members : ""
rooms ||--o{ room_invitations : ""
users ||--o{ room_invitations : "inviter_id"
users ||--o{ room_invitations : "invitee_id"
rooms ||--o{ room_invite_links : ""
rooms ||--o{ room_access_requests : ""
rooms ||--|| room_conversations : "1:1"
room_conversations ||--|| conversations : ""
conversations ||--o{ messages : ""
messages ||--o{ message_reads : ""
messages ||--o{ message_reactions : ""
rooms ||--o{ room_moderation_logs : ""

users {
uuid id PK
text name
}
rooms {
uuid id PK
text name
text description
room_visibility visibility
text code
uuid owner_id FK
int current_members
timestamptz created_at
timestamptz updated_at
}
room_members {
uuid room_id FK
uuid user_id FK
room_member_role role
bool favorite
bool notifications_enabled
timestamptz joined_at
timestamptz last_seen_at
PK(room_id,user_id)
}
room_invitations {
uuid id PK
uuid room_id FK
uuid inviter_id FK
uuid invitee_id FK
invitation_type type
invitation_status status
text token
timestamptz expires_at
timestamptz accepted_at
timestamptz revoked_at
uuid revoked_by
timestamptz created_at
}
room_invite_links {
uuid id PK
uuid room_id FK
uuid created_by FK
text url_token
int max_uses
int uses
timestamptz expires_at
bool active
timestamptz created_at
}
room_access_requests {
uuid id PK
uuid room_id FK
uuid requester_id FK
access_request_status status
timestamptz created_at
timestamptz decided_at
uuid decided_by
}
room_conversations {
uuid room_id FK UNIQUE
uuid conversation_id FK UNIQUE
}
conversations {
uuid id PK
timestamptz created_at
timestamptz updated_at
}
messages {
uuid id PK
uuid conversation_id FK
uuid sender_id FK
text content
bool edited
timestamptz created_at
timestamptz updated_at
timestamptz deleted_at
}
message_reads {
uuid message_id FK
uuid user_id FK
timestamptz read_at
PK(message_id,user_id)
}
message_reactions {
uuid message_id FK
uuid user_id FK
varchar reaction
timestamptz created_at
PK(message_id,user_id,reaction)
}
room_moderation_logs {
uuid id PK
uuid room_id FK
uuid actor_id FK
moderation_action action
uuid target_user_id
uuid message_id
text reason
timestamptz created_at
}

2.5 Script SQL (PostgreSQL) — Migrações idempotentes

Padrão: Migrations “Flyway-like” (V001\_\_\*.sql), transacionais, idempotentes (checam existência).
Extensões: pgcrypto (UUID gen_random_uuid()), pg_trgm (busca por similaridade).

-- =====================================================================
-- V001\_\_baseline.sql
-- =====================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS app;

-- extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- tabela users (stub para FK; em produção, pode referenciar auth.users)
CREATE TABLE IF NOT EXISTS app.users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tipos (ENUM) - criar se não existir
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_visibility') THEN
CREATE TYPE app.room_visibility AS ENUM ('public','private');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_member_role') THEN
CREATE TYPE app.room_member_role AS ENUM ('owner','moderator','member');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_type') THEN
CREATE TYPE app.invitation_type AS ENUM ('direct','link');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
CREATE TYPE app.invitation_status AS ENUM ('pending','accepted','revoked','expired');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_request_status') THEN
CREATE TYPE app.access_request_status AS ENUM ('pending','approved','denied','cancelled');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action') THEN
CREATE TYPE app.moderation_action AS ENUM (
'invite_create','invite_revoke','member_promote','member_demote',
'member_kick','message_delete','room_update'
);
END IF;
END$$;

-- função util: atualiza updated_at
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

COMMIT;

-- =====================================================================
-- V002\_\_rooms_and_members.sql
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS app.rooms (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
description TEXT NULL,
visibility app.room_visibility NOT NULL DEFAULT 'public',
code TEXT NOT NULL UNIQUE,
owner_id UUID NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
current_members INT NOT NULL DEFAULT 0,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
CONSTRAINT chk_room_name_len CHECK (char_length(name) BETWEEN 3 AND 50),
CONSTRAINT chk_room_desc_len CHECK (description IS NULL OR char_length(description) <= 200),
CONSTRAINT chk_room_code_format CHECK (code ~ '^#[A-Z0-9]{2,4}$')
);

-- índice de busca por nome (trgm)
CREATE INDEX IF NOT EXISTS idx_rooms_name_trgm ON app.rooms USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON app.rooms(owner_id);

-- trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rooms_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_rooms_set_updated_at
    BEFORE UPDATE ON app.rooms
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
  END IF;
END$$;

-- memberships
CREATE TABLE IF NOT EXISTS app.room_members (
room_id UUID NOT NULL REFERENCES app.rooms(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
role app.room_member_role NOT NULL DEFAULT 'member',
favorite BOOLEAN NOT NULL DEFAULT false,
notifications_enabled BOOLEAN NOT NULL DEFAULT true,
joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
last_seen_at TIMESTAMPTZ NULL,
PRIMARY KEY (room_id, user_id)
);

-- único owner por sala (parcial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='app' AND indexname='ux_room_members_one_owner_per_room'
  ) THEN
    CREATE UNIQUE INDEX ux_room_members_one_owner_per_room
    ON app.room_members(room_id)
    WHERE role = 'owner';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_room_members_user ON app.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_role ON app.room_members(role);

-- contadores de membros
CREATE OR REPLACE FUNCTION app.increment_room_members_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE app.rooms SET current_members = current_members + 1 WHERE id = NEW.room_id;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION app.decrement_room_members_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE app.rooms SET current_members = GREATEST(0, current_members - 1) WHERE id = OLD.room_id;
  RETURN OLD;
END$$;

-- prevenir perda do último owner
CREATE OR REPLACE FUNCTION app.prevent_last_owner_loss()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE owners_count INT;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner')
     OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role <> 'owner')
  THEN
    SELECT COUNT(*) INTO owners_count
    FROM app.room_members
    WHERE room_id = OLD.room_id AND role = 'owner'
      AND (TG_OP <> 'DELETE' OR (room_id,user_id) <> (OLD.room_id,OLD.user_id))
      AND (TG_OP <> 'UPDATE' OR (room_id,user_id) <> (OLD.room_id,OLD.user_id));
    -- owners_count conta owners diferentes do OLD; precisamos verificar se haverá outro owner
    IF owners_count = 0 THEN
      RAISE EXCEPTION 'Operation would remove the last owner of the room %', OLD.room_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END$$;

-- triggers
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_room_members_inc') THEN
CREATE TRIGGER trg_room_members_inc AFTER INSERT ON app.room_members
FOR EACH ROW EXECUTE FUNCTION app.increment_room_members_count();
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_room_members_dec') THEN
CREATE TRIGGER trg_room_members_dec AFTER DELETE ON app.room_members
FOR EACH ROW EXECUTE FUNCTION app.decrement_room_members_count();
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_room_members_last_owner_guard_del') THEN
CREATE TRIGGER trg_room_members_last_owner_guard_del
BEFORE DELETE ON app.room_members
FOR EACH ROW EXECUTE FUNCTION app.prevent_last_owner_loss();
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_room_members_last_owner_guard_upd') THEN
CREATE TRIGGER trg_room_members_last_owner_guard_upd
BEFORE UPDATE ON app.room_members
FOR EACH ROW EXECUTE FUNCTION app.prevent_last_owner_loss();
END IF;
END$$;

COMMIT;

-- =====================================================================
-- V003\_\_invites_access_requests.sql
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS app.room_invitations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
room_id UUID NOT NULL REFERENCES app.rooms(id) ON DELETE CASCADE,
inviter_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
invitee_id UUID NULL REFERENCES app.users(id) ON DELETE SET NULL,
type app.invitation_type NOT NULL,
status app.invitation_status NOT NULL DEFAULT 'pending',
token TEXT UNIQUE NULL,
expires_at TIMESTAMPTZ NULL,
accepted_at TIMESTAMPTZ NULL,
revoked_at TIMESTAMPTZ NULL,
revoked_by UUID NULL REFERENCES app.users(id) ON DELETE SET NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_invites_room_status ON app.room_invitations(room_id, status);
CREATE INDEX IF NOT EXISTS idx_room_invites_invitee_status ON app.room_invitations(invitee_id, status);

CREATE TABLE IF NOT EXISTS app.room_invite_links (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
room_id UUID NOT NULL REFERENCES app.rooms(id) ON DELETE CASCADE,
created_by UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
url_token TEXT NOT NULL UNIQUE,
max_uses INT NULL,
uses INT NOT NULL DEFAULT 0,
expires_at TIMESTAMPTZ NULL,
active BOOLEAN NOT NULL DEFAULT true,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.room_access_requests (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
room_id UUID NOT NULL REFERENCES app.rooms(id) ON DELETE CASCADE,
requester_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
status app.access_request_status NOT NULL DEFAULT 'pending',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
decided_at TIMESTAMPTZ NULL,
decided_by UUID NULL REFERENCES app.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_access_requests_room_status ON app.room_access_requests(room_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester_status ON app.room_access_requests(requester_id, status);

COMMIT;

-- =====================================================================
-- V004\_\_chat_core.sql
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS app.conversations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='app' AND table_name='room_conversations'
  ) THEN
    CREATE TABLE app.room_conversations (
      room_id UUID NOT NULL UNIQUE REFERENCES app.rooms(id) ON DELETE CASCADE,
      conversation_id UUID NOT NULL UNIQUE REFERENCES app.conversations(id) ON DELETE CASCADE
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS app.messages (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
sender_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
content TEXT NOT NULL,
edited BOOLEAN NOT NULL DEFAULT false,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NULL,
deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc ON app.messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app.message_reads (
message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.message_reactions (
message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
reaction VARCHAR(32) NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (message_id, user_id, reaction)
);

-- triggers updated_at para conversations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_conversations_set_updated_at') THEN
    CREATE TRIGGER trg_conversations_set_updated_at
    BEFORE UPDATE ON app.conversations
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
  END IF;
END$$;

COMMIT;

-- =====================================================================
-- V005\_\_moderation_logs.sql
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS app.room_moderation_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
room_id UUID NOT NULL REFERENCES app.rooms(id) ON DELETE CASCADE,
actor_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
action app.moderation_action NOT NULL,
target_user_id UUID NULL REFERENCES app.users(id) ON DELETE SET NULL,
message_id UUID NULL REFERENCES app.messages(id) ON DELETE SET NULL,
reason TEXT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mlog_room_created ON app.room_moderation_logs(room_id, created_at DESC);

COMMIT;
