# Study Space - Sistema de Menções @username 🏷️

## 📋 Visão Geral

O Sistema de Menções @username revolucionará a comunicação no Study Space, permitindo que usuários referenciem outros membros da comunidade de forma direta e contextual, criando conversas mais engajantes e uma rede de conexões mais forte entre estudantes.

**Prioridade:** Alta (RICE Score: 8.9)  
**Sprint:** 1-2 (Q1 2025)  
**Effort:** 3 sprints  
**Impact:** Alto (social interactions +55%, notification engagement +40%)

## 🎯 Objetivos e KPIs

### **Objetivos Estratégicos**
- Aumentar interações diretas entre usuários em 55%
- Melhorar taxa de resposta a posts/comentários em 40%
- Criar threads de discussão mais profundos e contextuais
- Facilitar networking acadêmico através de menções estratégicas
- Estabelecer base para sistema de reputação baseado em menções

### **KPIs Principais**
| Métrica | Baseline Atual | Meta Q1 2025 | Meta Q2 2025 |
|---------|---------------|---------------|---------------|
| Menções criadas/dia | 0 | 850 | 2,100 |
| Taxa de resposta a menções | 0% | 75% | 85% |
| Posts com menções | 0% | 25% | 35% |
| Usuários ativos em menções | 0% | 60% | 78% |
| Tempo de resposta médio | N/A | 2.3h | 1.8h |

### **Métricas Sociais**
- **Conversation Threads**: Threads com 3+ participantes via menções
- **Cross-Community Mentions**: Menções entre comunidades diferentes
- **Expert Discovery**: Usuários descobertos através de menções especializadas
- **Network Growth**: Novas conexões iniciadas via menções

## 🏗️ Arquitetura Técnica Completa

### **1. Backend Architecture**

#### **1.1 Modelo de Dados**
```sql
-- Tabela principal de menções
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contexto da menção
    mention_text TEXT NOT NULL, -- Texto ao redor da menção
    mention_position INTEGER NOT NULL, -- Posição no texto
    context_type mention_context_type DEFAULT 'general',
    
    -- Status e metadata
    is_read BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false, -- Usuário clicou na menção
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Índices para performance
    INDEX idx_mentions_mentioned_user (mentioned_user_id, created_at DESC),
    INDEX idx_mentions_post (post_id, created_at DESC),
    INDEX idx_mentions_comment (comment_id, created_at DESC),
    INDEX idx_mentions_mentioner (mentioner_user_id, created_at DESC),
    INDEX idx_mentions_unread (mentioned_user_id, is_read, created_at DESC)
);

-- Tipos de contexto para menções
CREATE TYPE mention_context_type AS ENUM (
    'general',        -- Menção geral
    'question',       -- Pergunta direcionada
    'answer',         -- Resposta/explicação
    'collaboration',  -- Convite para colaborar
    'appreciation',   -- Agradecimento/reconhecimento
    'challenge',      -- Desafio/debate
    'expertise'       -- Pedindo opinião de especialista
);

-- Configurações de notificações de menções por usuário
CREATE TABLE mention_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    
    -- Filtros de menções
    only_from_friends BOOLEAN DEFAULT false,
    block_spam_mentions BOOLEAN DEFAULT true,
    auto_acknowledge BOOLEAN DEFAULT false,
    
    -- Configurações de privacidade
    allow_mentions_in_posts BOOLEAN DEFAULT true,
    allow_mentions_in_comments BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para tracking de spam de menções
CREATE TABLE mention_spam_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentioner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentions_count INTEGER DEFAULT 1,
    first_mention_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_mention_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT false,
    
    UNIQUE(mentioner_user_id, mentioned_user_id),
    INDEX idx_mention_spam_mentioner (mentioner_user_id, last_mention_at DESC),
    INDEX idx_mention_spam_mentioned (mentioned_user_id, last_mention_at DESC)
);

-- Tabela para menções em drafts (permite salvar menções antes de publicar)
CREATE TABLE mention_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL, -- ID do draft
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mention_text TEXT NOT NULL,
    mention_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_mention_drafts_draft (draft_id, created_at DESC)
);

-- View para analytics de menções
CREATE VIEW mention_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT mentioned_user_id) as unique_mentioned_users,
    COUNT(DISTINCT mentioner_user_id) as unique_mentioner_users,
    AVG(CASE WHEN read_at IS NOT NULL THEN EXTRACT(EPOCH FROM (read_at - created_at)) END) as avg_response_time_seconds,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_mentions,
    COUNT(CASE WHEN is_acknowledged = true THEN 1 END) as acknowledged_mentions,
    COUNT(CASE WHEN context_type = 'question' THEN 1 END) as question_mentions,
    COUNT(CASE WHEN context_type = 'expertise' THEN 1 END) as expertise_mentions
FROM mentions
GROUP BY DATE_TRUNC('day', created_at);
```

#### **1.2 API Endpoints**

##### **Core Mention Endpoints**
```javascript
// routes/mentions.js
const express = require('express');
const router = express.Router();
const mentionsController = require('../controllers/mentionsController');
const authenticateToken = require('../middleware/authenticateToken');
const rateLimiter = require('../middleware/rateLimiter');
const validateMention = require('../middleware/validateMention');

// Criar menções (automaticamente quando post/comment é criado)
router.post('/mentions/create',
    authenticateToken,
    rateLimiter.mentions, // 100 menções por hora
    validateMention,
    mentionsController.createMentions
);

// Buscar menções recebidas (notificações)
router.get('/mentions/received',
    authenticateToken,
    mentionsController.getReceivedMentions
);

// Marcar menção como lida
router.put('/mentions/:mentionId/read',
    authenticateToken,
    mentionsController.markMentionAsRead
);

// Marcar menção como reconhecida (acknowledged)
router.put('/mentions/:mentionId/acknowledge',
    authenticateToken,
    mentionsController.acknowledgeMention
);

// Buscar usuários para autocompletar (@)
router.get('/mentions/search-users',
    authenticateToken,
    rateLimiter.search, // 200 buscas por minuto
    mentionsController.searchUsersForMention
);

// Configurações de preferências de menções
router.get('/mentions/preferences',
    authenticateToken,
    mentionsController.getMentionPreferences
);

router.put('/mentions/preferences',
    authenticateToken,
    mentionsController.updateMentionPreferences
);

// Bloquear usuário de fazer menções
router.post('/mentions/block/:userId',
    authenticateToken,
    mentionsController.blockUserMentions
);

// Analytics de menções (para o usuário)
router.get('/mentions/analytics/my',
    authenticateToken,
    mentionsController.getMyMentionAnalytics
);

module.exports = router;
```

##### **Text Processing Endpoints**
```javascript
// routes/textProcessing.js
router.post('/text/extract-mentions',
    authenticateToken,
    rateLimiter.textProcessing,
    textProcessingController.extractMentions
);

router.post('/text/validate-mentions',
    authenticateToken,
    textProcessingController.validateMentionPermissions
);

router.post('/text/preview-mentions',
    authenticateToken,
    textProcessingController.previewMentionNotifications
);
```

#### **1.3 Controller Implementation**

```javascript
// controllers/mentionsController.js
const db = require('../config/database');
const { extractMentionsFromText } = require('../services/mentionExtractor');
const { sendMentionNotification } = require('../services/notificationService');
const { checkMentionPermissions } = require('../services/mentionPermissions');
const { trackEvent } = require('../services/analytics');

const mentionsController = {
    async createMentions(req, res) {
        try {
            const { content, post_id, comment_id, context_type = 'general' } = req.body;
            const mentioner_user_id = req.user.id;
            
            // Extrair menções do texto
            const extractedMentions = extractMentionsFromText(content);
            
            if (extractedMentions.length === 0) {
                return res.json({ success: true, mentions_created: 0 });
            }
            
            // Validar que os usuários mencionados existem
            const userIds = extractedMentions.map(m => m.userId);
            const validUsers = await db.query(
                'SELECT id, nickname FROM users WHERE id = ANY($1)',
                [userIds]
            );
            
            const validUserIds = new Set(validUsers.rows.map(u => u.id));
            const validMentions = extractedMentions.filter(m => 
                validUserIds.has(m.userId) && m.userId !== mentioner_user_id
            );
            
            if (validMentions.length === 0) {
                return res.json({ success: true, mentions_created: 0 });
            }
            
            // Verificar permissões e spam
            const allowedMentions = [];
            for (const mention of validMentions) {
                const canMention = await checkMentionPermissions(
                    mentioner_user_id, 
                    mention.userId
                );
                
                if (canMention) {
                    allowedMentions.push(mention);
                }
            }
            
            if (allowedMentions.length === 0) {
                return res.status(403).json({ 
                    error: 'Não foi possível mencionar estes usuários' 
                });
            }
            
            // Criar menções no banco
            const mentionsData = allowedMentions.map(mention => [
                post_id,
                comment_id,
                mention.userId,
                mentioner_user_id,
                mention.contextText,
                mention.position,
                context_type
            ]);
            
            const createdMentions = await db.query(`
                INSERT INTO mentions (
                    post_id, comment_id, mentioned_user_id, mentioner_user_id,
                    mention_text, mention_position, context_type
                )
                SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::uuid[], 
                                   $5::text[], $6::int[], $7::mention_context_type[])
                RETURNING *
            `, [
                mentionsData.map(m => m[0]), // post_ids
                mentionsData.map(m => m[1]), // comment_ids
                mentionsData.map(m => m[2]), // mentioned_user_ids
                mentionsData.map(m => m[3]), // mentioner_user_ids
                mentionsData.map(m => m[4]), // mention_texts
                mentionsData.map(m => m[5]), // positions
                mentionsData.map(m => m[6])  // context_types
            ]);
            
            // Enviar notificações
            for (const mention of createdMentions.rows) {
                await sendMentionNotification(mention, req.user);
            }
            
            // Update spam tracking
            await updateSpamTracking(mentioner_user_id, allowedMentions.map(m => m.userId));
            
            // Analytics
            await trackEvent('mentions_created', {
                mentioner_user_id,
                mentions_count: createdMentions.rows.length,
                context_type,
                post_id,
                comment_id
            });
            
            res.json({
                success: true,
                mentions_created: createdMentions.rows.length,
                mentions: createdMentions.rows
            });
            
        } catch (error) {
            console.error('Error creating mentions:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getReceivedMentions(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 20, offset = 0, unread_only = false } = req.query;
            
            let whereClause = 'WHERE m.mentioned_user_id = $1';
            const queryParams = [userId];
            
            if (unread_only === 'true') {
                whereClause += ' AND m.is_read = false';
            }
            
            const mentions = await db.query(`
                SELECT 
                    m.*,
                    u.nickname as mentioner_nickname,
                    u.avatar_url as mentioner_avatar_url,
                    p.content as post_content,
                    p.type as post_type,
                    c.content as comment_content,
                    CASE 
                        WHEN p.id IS NOT NULL THEN 'post'
                        WHEN c.id IS NOT NULL THEN 'comment'
                    END as mention_source
                FROM mentions m
                JOIN users u ON m.mentioner_user_id = u.id
                LEFT JOIN posts p ON m.post_id = p.id
                LEFT JOIN comments c ON m.comment_id = c.id
                ${whereClause}
                ORDER BY m.created_at DESC
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `, [...queryParams, limit, offset]);
            
            // Marcar como vistas (delivered) as menções não lidas
            if (mentions.rows.length > 0) {
                const unreadMentionIds = mentions.rows
                    .filter(m => !m.is_read)
                    .map(m => m.id);
                
                if (unreadMentionIds.length > 0) {
                    await db.query(
                        'UPDATE mentions SET is_read = true, read_at = NOW() WHERE id = ANY($1)',
                        [unreadMentionIds]
                    );
                }
            }
            
            res.json({
                success: true,
                mentions: mentions.rows,
                total_unread: await getUnreadMentionsCount(userId)
            });
            
        } catch (error) {
            console.error('Error getting received mentions:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async searchUsersForMention(req, res) {
        try {
            const { query, limit = 10 } = req.query;
            const searcherId = req.user.id;
            
            if (!query || query.length < 2) {
                return res.json({ success: true, users: [] });
            }
            
            // Buscar usuários que o user pode mencionar
            const users = await db.query(`
                SELECT DISTINCT
                    u.id,
                    u.nickname,
                    u.avatar_url,
                    u.name,
                    -- Priorizar amigos
                    CASE 
                        WHEN c.status = 'accepted' THEN 1
                        ELSE 2
                    END as priority,
                    -- Relevância de busca
                    SIMILARITY(u.nickname, $1) as similarity
                FROM users u
                LEFT JOIN connections c ON (
                    (c.user1_id = $2 AND c.user2_id = u.id) OR
                    (c.user2_id = $2 AND c.user1_id = u.id)
                )
                LEFT JOIN mention_preferences mp ON u.id = mp.user_id
                WHERE 
                    u.id != $2
                    AND (
                        u.nickname ILIKE $3 OR 
                        u.name ILIKE $3 OR
                        SIMILARITY(u.nickname, $1) > 0.3
                    )
                    AND (mp.allow_mentions_in_posts = true OR mp.user_id IS NULL)
                    AND NOT EXISTS (
                        SELECT 1 FROM mention_spam_tracking mst
                        WHERE mst.mentioner_user_id = $2 
                        AND mst.mentioned_user_id = u.id
                        AND mst.is_blocked = true
                    )
                ORDER BY priority, similarity DESC, u.nickname
                LIMIT $4
            `, [query, searcherId, `%${query}%`, limit]);
            
            res.json({
                success: true,
                users: users.rows,
                query: query
            });
            
        } catch (error) {
            console.error('Error searching users for mention:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async acknowledgeMention(req, res) {
        try {
            const { mentionId } = req.params;
            const userId = req.user.id;
            
            const result = await db.query(`
                UPDATE mentions 
                SET is_acknowledged = true, acknowledged_at = NOW()
                WHERE id = $1 AND mentioned_user_id = $2
                RETURNING *
            `, [mentionId, userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Menção não encontrada' });
            }
            
            // Analytics
            await trackEvent('mention_acknowledged', {
                mention_id: mentionId,
                acknowledged_by: userId
            });
            
            res.json({ success: true, mention: result.rows[0] });
            
        } catch (error) {
            console.error('Error acknowledging mention:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

// Função auxiliar para contar menções não lidas
async function getUnreadMentionsCount(userId) {
    const result = await db.query(
        'SELECT COUNT(*) as count FROM mentions WHERE mentioned_user_id = $1 AND is_read = false',
        [userId]
    );
    return parseInt(result.rows[0].count);
}

// Função auxiliar para atualizar tracking de spam
async function updateSpamTracking(mentionerId, mentionedUserIds) {
    for (const mentionedUserId of mentionedUserIds) {
        await db.query(`
            INSERT INTO mention_spam_tracking (mentioner_user_id, mentioned_user_id)
            VALUES ($1, $2)
            ON CONFLICT (mentioner_user_id, mentioned_user_id)
            DO UPDATE SET 
                mentions_count = mention_spam_tracking.mentions_count + 1,
                last_mention_at = NOW()
        `, [mentionerId, mentionedUserId]);
    }
}

module.exports = mentionsController;
```

#### **1.4 Mention Extraction Service**
```javascript
// services/mentionExtractor.js
const MENTION_REGEX = /@([a-zA-Z0-9_]{3,20})/g;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

class MentionExtractor {
    extractMentionsFromText(text) {
        const mentions = [];
        let match;
        
        // Reset regex
        MENTION_REGEX.lastIndex = 0;
        
        while ((match = MENTION_REGEX.exec(text)) !== null) {
            const username = match[1];
            const position = match.index;
            
            // Validar formato do username
            if (!USERNAME_REGEX.test(username)) {
                continue;
            }
            
            // Extrair contexto ao redor da menção (30 caracteres antes e depois)
            const contextStart = Math.max(0, position - 30);
            const contextEnd = Math.min(text.length, position + match[0].length + 30);
            const contextText = text.substring(contextStart, contextEnd);
            
            mentions.push({
                username: username,
                position: position,
                contextText: contextText,
                fullMatch: match[0]
            });
        }
        
        return mentions;
    }
    
    // Resolver usernames para IDs de usuário
    async resolveMentionUsernames(mentions) {
        if (mentions.length === 0) return [];
        
        const usernames = mentions.map(m => m.username);
        const users = await db.query(
            'SELECT id, nickname FROM users WHERE nickname = ANY($1)',
            [usernames]
        );
        
        const usernameToId = new Map();
        users.rows.forEach(user => {
            usernameToId.set(user.nickname.toLowerCase(), user.id);
        });
        
        return mentions
            .map(mention => ({
                ...mention,
                userId: usernameToId.get(mention.username.toLowerCase())
            }))
            .filter(mention => mention.userId); // Remove menções inválidas
    }
    
    // Destacar menções no texto (para exibição)
    highlightMentionsInText(text, mentions) {
        if (!mentions || mentions.length === 0) return text;
        
        let highlightedText = text;
        
        // Processar menções em ordem reversa para manter posições corretas
        const sortedMentions = mentions
            .sort((a, b) => b.position - a.position);
        
        sortedMentions.forEach(mention => {
            const beforeText = highlightedText.substring(0, mention.position);
            const afterText = highlightedText.substring(
                mention.position + mention.fullMatch.length
            );
            
            const highlightedMention = `<span class="mention" data-user-id="${mention.userId}">@${mention.username}</span>`;
            
            highlightedText = beforeText + highlightedMention + afterText;
        });
        
        return highlightedText;
    }
    
    // Validar se menção é contextualmente apropriada
    validateMentionContext(mention, postContent, postType) {
        const context = mention.contextText.toLowerCase();
        
        // Detectar contexto de pergunta
        if (context.includes('você') || context.includes('pode') || 
            context.includes('ajuda') || context.includes('?')) {
            return 'question';
        }
        
        // Detectar agradecimento
        if (context.includes('obrigad') || context.includes('valeu') ||
            context.includes('agradeç')) {
            return 'appreciation';
        }
        
        // Detectar pedido de expertise
        if (context.includes('especialist') || context.includes('expert') ||
            context.includes('opinião') || context.includes('experiência')) {
            return 'expertise';
        }
        
        // Detectar colaboração
        if (context.includes('vamos') || context.includes('junto') ||
            context.includes('colabor')) {
            return 'collaboration';
        }
        
        return 'general';
    }
}

module.exports = new MentionExtractor();
```

### **2. Frontend Implementation**

#### **2.1 Componente de Mention Input**
```typescript
// src/components/Mentions/MentionInput.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MentionSuggestions } from './MentionSuggestions';
import { useMentionSearch } from '@/hooks/useMentions';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: MentionData[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

interface MentionData {
  username: string;
  userId: string;
  position: number;
  length: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "Escreva aqui... (@username para mencionar)",
  className,
  disabled = false,
  maxLength = 1000
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [currentMentions, setCurrentMentions] = useState<MentionData[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { searchUsers, isLoading: isSearching } = useMentionSearch();
  
  // Detectar when user digita @
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    
    // Extrair menções existentes
    const mentions = extractMentionsFromValue(newValue);
    setCurrentMentions(mentions);
    
    // Detectar se usuário está digitando uma menção
    const mentionMatch = detectMentionTyping(newValue, selectionStart);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch.query);
      setMentionPosition({ start: mentionMatch.start, end: selectionStart });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
    
    onChange(newValue, mentions);
  }, [onChange]);
  
  // Inserir menção selecionada
  const insertMention = useCallback((user: { id: string; nickname: string }) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const beforeMention = value.substring(0, mentionPosition.start);
    const afterMention = value.substring(mentionPosition.end);
    
    const newValue = beforeMention + `@${user.nickname} ` + afterMention;
    const newCursorPosition = beforeMention.length + user.nickname.length + 2;
    
    // Update value
    const newMentions = extractMentionsFromValue(newValue);
    onChange(newValue, newMentions);
    
    // Update cursor position
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
    
    setShowSuggestions(false);
    setMentionQuery('');
  }, [value, mentionPosition, onChange]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setMentionQuery('');
        return;
      }
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Navigation será handleada pelo componente MentionSuggestions
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        // Enter/Tab será handleado pelo componente MentionSuggestions
        return;
      }
    }
  }, [showSuggestions]);
  
  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[100px] resize-none", className)}
        disabled={disabled}
        maxLength={maxLength}
      />
      
      {/* Character count */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </div>
      
      {/* Mention suggestions */}
      {showSuggestions && mentionQuery.length >= 1 && (
        <MentionSuggestions
          query={mentionQuery}
          onSelect={insertMention}
          onClose={() => setShowSuggestions(false)}
          position="below"
        />
      )}
    </div>
  );
};

// Utility functions
const detectMentionTyping = (text: string, cursorPosition: number) => {
  // Procurar por @ antes da posição do cursor
  let mentionStart = -1;
  
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = text[i];
    
    if (char === '@') {
      mentionStart = i;
      break;
    }
    
    // Se encontrar espaço ou quebra de linha, não é uma menção
    if (char === ' ' || char === '\n') {
      break;
    }
  }
  
  if (mentionStart === -1) return null;
  
  // Extrair query da menção
  const query = text.substring(mentionStart + 1, cursorPosition);
  
  // Validar que não tem espaços na query
  if (query.includes(' ')) return null;
  
  return {
    start: mentionStart,
    query: query
  };
};

const extractMentionsFromValue = (text: string): MentionData[] => {
  const mentions: MentionData[] = [];
  const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      userId: '', // Will be resolved later
      position: match.index,
      length: match[0].length
    });
  }
  
  return mentions;
};
```

#### **2.2 Componente de Sugestões de Menção**
```typescript
// src/components/Mentions/MentionSuggestions.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useMentionSearch } from '@/hooks/useMentions';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  nickname: string;
  avatar_url?: string;
  name?: string;
  priority: number; // 1 = friend, 2 = other
}

interface MentionSuggestionsProps {
  query: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  position?: 'above' | 'below';
  maxResults?: number;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  query,
  onSelect,
  onClose,
  position = 'below',
  maxResults = 8
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchUsers } = useMentionSearch();
  
  // Search users when query changes
  useEffect(() => {
    if (query.length === 0) {
      setUsers([]);
      return;
    }
    
    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchUsers(query, maxResults);
        setUsers(results);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce de 300ms
    
    return () => clearTimeout(searchTimeout);
  }, [query, maxResults, searchUsers]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : users.length - 1);
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < users.length - 1 ? prev + 1 : 0);
          break;
          
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex]);
          }
          break;
          
        case 'Escape':
          onClose();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);
  
  // Scroll selected item into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const selectedElement = container.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);
  
  if (isLoading) {
    return (
      <div className={cn(
        "absolute z-50 w-full bg-popover border rounded-lg shadow-lg p-2",
        position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
      )}>
        <div className="flex items-center justify-center p-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Buscando usuários...</span>
        </div>
      </div>
    );
  }
  
  if (users.length === 0 && query.length > 0) {
    return (
      <div className={cn(
        "absolute z-50 w-full bg-popover border rounded-lg shadow-lg p-2",
        position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
      )}>
        <div className="p-2 text-sm text-muted-foreground text-center">
          Nenhum usuário encontrado para "{query}"
        </div>
      </div>
    );
  }
  
  if (users.length === 0) return null;
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-50 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto",
        position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
      )}
    >
      {users.map((user, index) => (
        <div
          key={user.id}
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
            index === selectedIndex 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent/50"
          )}
          onClick={() => onSelect(user)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-xs">
              {user.nickname[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">@{user.nickname}</span>
              {user.priority === 1 && (
                <Badge variant="secondary" className="text-xs">
                  Amigo
                </Badge>
              )}
            </div>
            {user.name && (
              <p className="text-xs text-muted-foreground truncate">
                {user.name}
              </p>
            )}
          </div>
          
          {/* Keyboard hint */}
          {index === selectedIndex && (
            <div className="text-xs text-muted-foreground">
              Enter
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### **2.3 Componente de Exibição de Menções**
```typescript
// src/components/Mentions/MentionRenderer.tsx
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

interface MentionRendererProps {
  text: string;
  mentions?: Array<{
    username: string;
    userId: string;
    position: number;
    length: number;
  }>;
  className?: string;
  onMentionClick?: (userId: string) => void;
}

export const MentionRenderer: React.FC<MentionRendererProps> = ({
  text,
  mentions = [],
  className,
  onMentionClick
}) => {
  if (!mentions || mentions.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  // Dividir texto em partes, destacando menções
  const parts = [];
  let lastIndex = 0;
  
  // Ordenar menções por posição
  const sortedMentions = mentions.sort((a, b) => a.position - b.position);
  
  sortedMentions.forEach((mention, index) => {
    // Adicionar texto antes da menção
    if (mention.position > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, mention.position),
        key: `text-${index}`
      });
    }
    
    // Adicionar menção
    parts.push({
      type: 'mention',
      content: `@${mention.username}`,
      userId: mention.userId,
      key: `mention-${index}`
    });
    
    lastIndex = mention.position + mention.length;
  });
  
  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
      key: 'text-final'
    });
  }
  
  return (
    <span className={className}>
      {parts.map((part) => {
        if (part.type === 'text') {
          return <span key={part.key}>{part.content}</span>;
        }
        
        return (
          <MentionLink
            key={part.key}
            userId={part.userId}
            username={part.content}
            onClick={() => onMentionClick?.(part.userId)}
          />
        );
      })}
    </span>
  );
};

// Componente individual para cada menção
const MentionLink: React.FC<{
  userId: string;
  username: string;
  onClick?: () => void;
}> = ({ userId, username, onClick }) => {
  const { data: userProfile } = useUserProfile(userId);
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-primary hover:text-primary/80",
            "bg-primary/10 hover:bg-primary/20 rounded px-1 py-0.5",
            "text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          onClick={onClick}
        >
          {username}
        </button>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-80">
        {userProfile ? (
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback>
                {userProfile.nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">
                  {userProfile.name || userProfile.nickname}
                </h4>
                {userProfile.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verificado
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                @{userProfile.nickname}
              </p>
              
              {userProfile.bio && (
                <p className="text-sm mb-3 line-clamp-2">
                  {userProfile.bio}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button size="sm" variant="default">
                  Ver perfil
                </Button>
                <Button size="sm" variant="outline">
                  Seguir
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};
```

## 🔔 Sistema de Notificações

### **1. Notificações de Menção**
```typescript
// src/components/Mentions/MentionNotifications.tsx
import React from 'react';
import { Bell, User, MessageCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTimeAgo } from '@/lib/utils';
import { useMentionNotifications } from '@/hooks/useMentions';

interface MentionNotification {
  id: string;
  mentioner_nickname: string;
  mentioner_avatar_url?: string;
  mention_source: 'post' | 'comment';
  post_content?: string;
  comment_content?: string;
  context_type: string;
  created_at: string;
  is_read: boolean;
  is_acknowledged: boolean;
}

export const MentionNotifications: React.FC = () => {
  const { 
    data: notifications, 
    isLoading, 
    markAsRead, 
    acknowledge 
  } = useMentionNotifications();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!notifications?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Nenhuma menção ainda</p>
        <p className="text-xs">Você receberá notificações quando alguém te mencionar</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-96">
      <div className="space-y-1">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              !notification.is_read && "bg-primary/5 border-l-2 border-l-primary"
            )}
            onClick={() => {
              if (!notification.is_read) {
                markAsRead.mutate(notification.id);
              }
            }}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={notification.mentioner_avatar_url} />
              <AvatarFallback>
                {notification.mentioner_nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  @{notification.mentioner_nickname}
                </span>
                <span className="text-xs text-muted-foreground">
                  te mencionou
                </span>
                {getMentionIcon(notification.mention_source)}
                {!notification.is_read && (
                  <Badge variant="secondary" className="text-xs">
                    Novo
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {notification.post_content || notification.comment_content}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.created_at)}
                </span>
                
                {notification.is_read && !notification.is_acknowledged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledge.mutate(notification.id);
                    }}
                  >
                    Responder
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const getMentionIcon = (source: string) => {
  switch (source) {
    case 'post':
      return <FileText className="h-3 w-3 text-muted-foreground" />;
    case 'comment':
      return <MessageCircle className="h-3 w-3 text-muted-foreground" />;
    default:
      return <User className="h-3 w-3 text-muted-foreground" />;
  }
};
```

## 📊 Analytics e Insights

### **1. Dashboard de Métricas de Menções**
```typescript
// src/components/Mentions/MentionAnalytics.tsx
interface MentionStats {
  total_mentions_sent: number;
  total_mentions_received: number;
  response_rate: number;
  avg_response_time_hours: number;
  most_mentioned_users: Array<{
    user_id: string;
    nickname: string;
    mentions_count: number;
  }>;
  mention_contexts: Record<string, number>;
}

export const MentionAnalytics: React.FC<{ userId?: string }> = ({ userId }) => {
  const { data: stats, isLoading } = useMentionAnalytics(userId);
  
  if (isLoading || !stats) return <AnalyticsSkeleton />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Menções Enviadas"
        value={stats.total_mentions_sent}
        icon={<Send className="h-4 w-4" />}
        color="blue"
      />
      
      <StatCard
        title="Menções Recebidas"
        value={stats.total_mentions_received}
        icon={<Users className="h-4 w-4" />}
        color="green"
      />
      
      <StatCard
        title="Taxa de Resposta"
        value={`${Math.round(stats.response_rate * 100)}%`}
        icon={<MessageCircle className="h-4 w-4" />}
        color="purple"
      />
      
      <StatCard
        title="Tempo Médio Resposta"
        value={`${Math.round(stats.avg_response_time_hours)}h`}
        icon={<Clock className="h-4 w-4" />}
        color="orange"
      />
      
      {/* Context breakdown */}
      <div className="col-span-full">
        <MentionContextChart contexts={stats.mention_contexts} />
      </div>
      
      {/* Top mentioned users */}
      <div className="col-span-full">
        <TopMentionedUsers users={stats.most_mentioned_users} />
      </div>
    </div>
  );
};
```

## 🚀 Plano de Implementação

### **Sprint 1 (Semanas 1-2): Backend Foundation**
- [ ] Criação das tabelas de menções e configurações
- [ ] Implementação do serviço de extração de menções
- [ ] APIs básicas de CRUD para menções
- [ ] Sistema de notificações de menções
- [ ] Middleware de anti-spam

### **Sprint 2 (Semanas 3-4): Frontend Core**
- [ ] Componente MentionInput com autocomplete
- [ ] Sistema de sugestões de usuários
- [ ] Renderização de menções em posts/comentários
- [ ] Interface de notificações de menções

### **Sprint 3 (Semanas 5-6): Polish & Advanced Features**
- [ ] Analytics de menções
- [ ] Configurações de privacidade
- [ ] Otimizações de performance
- [ ] Testes E2E completos

## 📊 Métricas de Sucesso

### **Métricas Técnicas**
- **Search Response Time**: < 150ms para autocomplete
- **Mention Processing**: < 50ms para extrair menções
- **Notification Delivery**: < 2s para notificar menção
- **False Positive Rate**: < 2% em spam detection

### **Métricas de Produto**
- **Daily Mentions**: 850 menções por dia até fim Q1
- **Response Rate**: 75% dos usuários mencionados respondem
- **User Adoption**: 60% dos usuários ativos usam menções
- **Network Effect**: +30% nas conexões via menções

---

**Responsável Técnico:** Equipe Full-Stack  
**Timeline:** Q1 2025 (Sprints 1-3)  
**Dependencies:** Sistema de notificações existente  

*O Sistema de Menções criará uma camada de comunicação direta e contextual que transformará o Study Space em uma verdadeira rede social acadêmica conectada.*