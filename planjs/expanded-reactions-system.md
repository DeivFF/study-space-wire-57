# Study Space - Sistema de Reações Expandidas 😍🔥

## 📋 Visão Geral

O Sistema de Reações Expandidas transformará a experiência de interação social no Study Space, substituindo o sistema simples de "like" por um conjunto rico e contextualizado de reações emocionais que permitem expressão mais nuançada e analytics mais profundos sobre o engajamento dos usuários.

**Prioridade:** Crítica (RICE Score: 9.8)  
**Sprint:** 1-2 (Q1 2025)  
**Effort:** 2 sprints  
**Impact:** Alto (engagement +35%, expressividade +200%)

## 🎯 Objetivos e KPIs

### **Objetivos Estratégicos**
- Aumentar variedade de interações em 200%
- Melhorar dados de sentiment analysis dos posts
- Criar emotional connection mais forte entre usuários
- Facilitar descoberta de conteúdo por tipo de reação
- Estabelecer base para recommendation engine avançado

### **KPIs Principais**
| Métrica | Baseline Atual | Meta Q1 2025 | Meta Q2 2025 |
|---------|---------------|---------------|---------------|
| Reações totais/post | 12.5 (só likes) | 35.8 | 52.3 |
| Variedade de reações | 1.0 | 3.2 | 4.1 |
| Posts com reação | 68% | 85% | 92% |
| Tempo p/ reagir | 0.8s | 0.6s | 0.5s |
| Engagement Rate | 15.2% | 28.5% | 38.7% |

### **Métricas Comportamentais**
- **Emotional Distribution**: Mapa de calor das reações mais usadas
- **Context Relevance**: Precisão das reações por tipo de post
- **User Expression**: Diversidade de reações por usuário
- **Viral Potential**: Posts com reações mistas que geram mais engajamento

## 🎨 Design das Reações

### **1. Conjunto Principal de Reações**

#### **1.1 Reações Core (5 principais)**
```typescript
const CORE_REACTIONS = {
  LOVE: {
    emoji: '❤️',
    color: '#e91e63',
    label: 'Amei',
    description: 'Adorei este conteúdo!',
    animation: 'heartBeat',
    weight: 1.2, // Para algorithm ranking
    contexts: ['inspirational', 'success', 'achievement']
  },
  
  THUMBS_UP: {
    emoji: '👍',
    color: '#2196f3', 
    label: 'Curtir',
    description: 'Gostei / Concordo',
    animation: 'thumbsUp',
    weight: 1.0,
    contexts: ['helpful', 'agreement', 'general']
  },
  
  MIND_BLOWN: {
    emoji: '🤯',
    color: '#ff9800',
    label: 'Incrível', 
    description: 'Nossa, que incrível!',
    animation: 'explode',
    weight: 1.5,
    contexts: ['surprising', 'educational', 'breakthrough']
  },
  
  THINKING: {
    emoji: '🤔',
    color: '#9c27b0',
    label: 'Pensativo',
    description: 'Me fez pensar...',
    animation: 'think',
    weight: 1.1,
    contexts: ['philosophical', 'doubt', 'complex']
  },
  
  SUPPORT: {
    emoji: '💪',
    color: '#4caf50',
    label: 'Força!',
    description: 'Você consegue!',
    animation: 'flex',
    weight: 1.3,
    contexts: ['motivation', 'challenge', 'support']
  }
};
```

#### **1.2 Reações Contextuais (Study Space específicas)**
```typescript
const STUDY_REACTIONS = {
  LIGHTBULB: {
    emoji: '💡',
    color: '#ffc107',
    label: 'Entendi!',
    description: 'Agora faz sentido!',
    animation: 'lightUp',
    weight: 1.4,
    contexts: ['explanation', 'tutorial', 'clarification']
  },
  
  FIRE: {
    emoji: '🔥',
    color: '#ff5722',
    label: 'Fogo!',
    description: 'Conteúdo top demais!',
    animation: 'flame',
    weight: 1.6,
    contexts: ['trending', 'impressive', 'viral']
  },
  
  BRAIN: {
    emoji: '🧠',
    color: '#607d8b',
    label: 'Inteligente',
    description: 'Muito inteligente!',
    animation: 'pulse',
    weight: 1.3,
    contexts: ['smart', 'analytical', 'deep']
  },
  
  TROPHY: {
    emoji: '🏆',
    color: '#ffd700',
    label: 'Top!',
    description: 'Nota 10!',
    animation: 'bounce',
    weight: 1.5,
    contexts: ['achievement', 'excellence', 'success']
  }
};
```

## 🏗️ Arquitetura Técnica

### **1. Backend Implementation**

#### **1.1 Modelo de Dados Atualizado**
```sql
-- Atualizar tabela de reações existente
ALTER TABLE post_likes RENAME TO post_reactions;

-- Adicionar colunas para novo sistema
ALTER TABLE post_reactions 
ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like',
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índices otimizados
CREATE INDEX idx_post_reactions_type ON post_reactions(post_id, reaction_type);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id, created_at DESC);
CREATE INDEX idx_post_reactions_created ON post_reactions(created_at DESC);

-- Tabela para analytics de reações
CREATE TABLE reaction_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, reaction_type),
    INDEX idx_reaction_analytics_post (post_id),
    INDEX idx_reaction_analytics_type (reaction_type, last_updated DESC)
);

-- Tabela para configurações de reações por contexto
CREATE TABLE reaction_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    suggested_reactions TEXT[], -- Array de reaction types sugeridas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_reaction_contexts_post (post_id),
    INDEX idx_reaction_contexts_type (context_type)
);

-- Trigger para manter analytics atualizados
CREATE OR REPLACE FUNCTION update_reaction_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO reaction_analytics (post_id, reaction_type, count)
        VALUES (NEW.post_id, NEW.reaction_type, 1)
        ON CONFLICT (post_id, reaction_type)
        DO UPDATE SET count = reaction_analytics.count + 1, 
                     last_updated = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reaction_analytics 
        SET count = GREATEST(0, count - 1),
            last_updated = NOW()
        WHERE post_id = OLD.post_id AND reaction_type = OLD.reaction_type;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Decrementar reação antiga
        UPDATE reaction_analytics 
        SET count = GREATEST(0, count - 1),
            last_updated = NOW()
        WHERE post_id = OLD.post_id AND reaction_type = OLD.reaction_type;
        
        -- Incrementar reação nova
        INSERT INTO reaction_analytics (post_id, reaction_type, count)
        VALUES (NEW.post_id, NEW.reaction_type, 1)
        ON CONFLICT (post_id, reaction_type)
        DO UPDATE SET count = reaction_analytics.count + 1,
                     last_updated = NOW();
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reaction_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_analytics();
```

#### **1.2 API Endpoints Expandidos**
```javascript
// routes/reactions.js
const express = require('express');
const router = express.Router();
const reactionsController = require('../controllers/reactionsController');
const authenticateToken = require('../middleware/authenticateToken');
const rateLimiter = require('../middleware/rateLimiter');

// Reagir a um post
router.post('/posts/:postId/react',
    authenticateToken,
    rateLimiter.reactions, // 60 reações por minuto
    reactionsController.reactToPost
);

// Remover reação
router.delete('/posts/:postId/react',
    authenticateToken,
    reactionsController.removeReaction
);

// Buscar reações de um post
router.get('/posts/:postId/reactions',
    authenticateToken,
    reactionsController.getPostReactions
);

// Buscar quem reagiu com tipo específico
router.get('/posts/:postId/reactions/:reactionType/users',
    authenticateToken,
    reactionsController.getReactionUsers
);

// Analytics de reações (para criador do post)
router.get('/posts/:postId/reactions/analytics',
    authenticateToken,
    reactionsController.getReactionAnalytics
);

// Sugestões de reação baseadas no contexto
router.get('/posts/:postId/suggested-reactions',
    authenticateToken,
    reactionsController.getSuggestedReactions
);

// Trending reactions (para discovery)
router.get('/reactions/trending',
    authenticateToken,
    reactionsController.getTrendingReactions
);

module.exports = router;
```

#### **1.3 Controller Implementation**
```javascript
// controllers/reactionsController.js
const db = require('../config/database');
const { analyzePostContext } = require('../services/contextAnalyzer');
const { trackEvent } = require('../services/analytics');

const reactionsController = {
    async reactToPost(req, res) {
        try {
            const { postId } = req.params;
            const { reaction_type } = req.body;
            const userId = req.user.id;
            
            // Validar tipo de reação
            const validReactions = [
                'like', 'love', 'mind_blown', 'thinking', 'support',
                'lightbulb', 'fire', 'brain', 'trophy'
            ];
            
            if (!validReactions.includes(reaction_type)) {
                return res.status(400).json({ 
                    error: 'Tipo de reação inválido' 
                });
            }
            
            // Verificar se o post existe
            const post = await db.query(
                'SELECT id, user_id FROM posts WHERE id = $1',
                [postId]
            );
            
            if (post.rows.length === 0) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }
            
            // Verificar reação existente
            const existingReaction = await db.query(
                'SELECT reaction_type FROM post_reactions WHERE post_id = $1 AND user_id = $2',
                [postId, userId]
            );
            
            let result;
            let actionType;
            
            if (existingReaction.rows.length > 0) {
                // Atualizar reação existente
                if (existingReaction.rows[0].reaction_type === reaction_type) {
                    // Mesma reação - remover
                    await db.query(
                        'DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2',
                        [postId, userId]
                    );
                    actionType = 'removed';
                    result = { removed: true };
                } else {
                    // Reação diferente - atualizar
                    result = await db.query(
                        `UPDATE post_reactions 
                         SET reaction_type = $1, updated_at = NOW()
                         WHERE post_id = $2 AND user_id = $3
                         RETURNING *`,
                        [reaction_type, postId, userId]
                    );
                    actionType = 'updated';
                }
            } else {
                // Criar nova reação
                result = await db.query(
                    `INSERT INTO post_reactions (post_id, user_id, reaction_type)
                     VALUES ($1, $2, $3) RETURNING *`,
                    [postId, userId, reaction_type]
                );
                actionType = 'created';
            }
            
            // Buscar contadores atualizados
            const reactionCounts = await db.query(`
                SELECT reaction_type, count
                FROM reaction_analytics
                WHERE post_id = $1
                ORDER BY count DESC
            `, [postId]);
            
            // Notificar autor do post (se não for ele mesmo reagindo)
            if (post.rows[0].user_id !== userId && actionType !== 'removed') {
                // Enviar notificação real-time
                const io = req.app.get('socketio');
                io.to(`user_${post.rows[0].user_id}`).emit('post_reaction', {
                    post_id: postId,
                    user: {
                        id: userId,
                        nickname: req.user.nickname
                    },
                    reaction_type: reaction_type,
                    action: actionType
                });
            }
            
            // Analytics
            await trackEvent('post_reaction', {
                post_id: postId,
                user_id: userId,
                reaction_type: reaction_type,
                action: actionType,
                post_author_id: post.rows[0].user_id
            });
            
            res.json({
                success: true,
                action: actionType,
                reaction: result.removed ? null : result.rows[0],
                reaction_counts: reactionCounts.rows
            });
            
        } catch (error) {
            console.error('Error in reactToPost:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getPostReactions(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user.id;
            
            // Buscar todas as reações do post
            const reactions = await db.query(`
                SELECT 
                    ra.reaction_type,
                    ra.count,
                    CASE WHEN pr.user_id IS NOT NULL THEN true ELSE false END as user_reacted
                FROM reaction_analytics ra
                LEFT JOIN post_reactions pr ON ra.post_id = pr.post_id 
                    AND ra.reaction_type = pr.reaction_type 
                    AND pr.user_id = $2
                WHERE ra.post_id = $1 AND ra.count > 0
                ORDER BY ra.count DESC, ra.reaction_type
            `, [postId, userId]);
            
            // Buscar reação do usuário atual
            const userReaction = await db.query(
                'SELECT reaction_type FROM post_reactions WHERE post_id = $1 AND user_id = $2',
                [postId, userId]
            );
            
            res.json({
                success: true,
                reactions: reactions.rows,
                user_reaction: userReaction.rows[0]?.reaction_type || null
            });
            
        } catch (error) {
            console.error('Error in getPostReactions:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getReactionUsers(req, res) {
        try {
            const { postId, reactionType } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            
            const users = await db.query(`
                SELECT u.id, u.nickname, u.avatar_url, pr.created_at
                FROM post_reactions pr
                JOIN users u ON pr.user_id = u.id
                WHERE pr.post_id = $1 AND pr.reaction_type = $2
                ORDER BY pr.created_at DESC
                LIMIT $3 OFFSET $4
            `, [postId, reactionType, limit, offset]);
            
            res.json({
                success: true,
                users: users.rows,
                reaction_type: reactionType
            });
            
        } catch (error) {
            console.error('Error in getReactionUsers:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getSuggestedReactions(req, res) {
        try {
            const { postId } = req.params;
            
            // Buscar contexto do post
            const post = await db.query(
                'SELECT content, type, tags FROM posts WHERE id = $1',
                [postId]
            );
            
            if (post.rows.length === 0) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }
            
            // Analisar contexto e sugerir reações
            const context = await analyzePostContext(post.rows[0]);
            const suggestedReactions = getSuggestedReactionsByContext(context);
            
            res.json({
                success: true,
                context: context,
                suggested_reactions: suggestedReactions
            });
            
        } catch (error) {
            console.error('Error in getSuggestedReactions:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

// Função auxiliar para sugerir reações baseadas no contexto
function getSuggestedReactionsByContext(context) {
    const contextMap = {
        'educational': ['lightbulb', 'brain', 'thumbs_up'],
        'motivational': ['support', 'fire', 'love'],
        'achievement': ['trophy', 'fire', 'love'],
        'question': ['thinking', 'lightbulb', 'thumbs_up'],
        'controversial': ['thinking', 'mind_blown'],
        'funny': ['love', 'mind_blown', 'thumbs_up'],
        'inspiring': ['love', 'fire', 'support']
    };
    
    let suggested = ['thumbs_up']; // Sempre incluir like básico
    
    context.categories.forEach(category => {
        if (contextMap[category]) {
            suggested = [...suggested, ...contextMap[category]];
        }
    });
    
    // Remover duplicatas e limitar a 5 sugestões
    return [...new Set(suggested)].slice(0, 5);
}

module.exports = reactionsController;
```

### **2. Frontend Implementation**

#### **2.1 Componente Principal de Reações**
```typescript
// src/components/Reactions/ReactionButton.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useReactions } from '@/hooks/useReactions';
import { AnimatedReaction } from './AnimatedReaction';
import { ReactionPicker } from './ReactionPicker';
import { cn } from '@/lib/utils';

interface ReactionButtonProps {
  postId: string;
  currentReaction?: string | null;
  reactionCounts: Record<string, number>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  postId,
  currentReaction,
  reactionCounts,
  className,
  size = 'md'
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { reactToPost, isLoading } = useReactions();
  
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  
  const handleQuickReaction = async (reactionType: string = 'thumbs_up') => {
    if (isLoading) return;
    
    setIsAnimating(true);
    
    try {
      await reactToPost.mutateAsync({
        postId,
        reactionType
      });
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
    
    // Reset animation after delay
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };
  
  const handleReactionSelect = async (reactionType: string) => {
    setShowPicker(false);
    await handleQuickReaction(reactionType);
  };
  
  const handleLongPress = () => {
    setShowPicker(true);
  };
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const buttonSize = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm', 
    lg: 'h-12 px-4 text-base'
  }[size];
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  return (
    <div className="flex items-center gap-1">
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant={currentReaction ? "default" : "ghost"}
            size="sm"
            className={cn(
              buttonSize,
              "relative transition-all duration-200",
              currentReaction && "bg-primary/10 text-primary border-primary/20",
              isAnimating && "scale-110",
              className
            )}
            onClick={() => handleQuickReaction(currentReaction || 'thumbs_up')}
            onMouseDown={() => {
              // Long press detection
              timeoutRef.current = setTimeout(handleLongPress, 500);
            }}
            onMouseUp={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            disabled={isLoading}
          >
            {isAnimating && currentReaction ? (
              <AnimatedReaction 
                type={currentReaction} 
                className={iconSize} 
              />
            ) : (
              <>
                {currentReaction ? (
                  <span className={cn("mr-1", iconSize)}>
                    {getReactionEmoji(currentReaction)}
                  </span>
                ) : (
                  <Heart className={cn("mr-1", iconSize)} />
                )}
                
                {totalReactions > 0 && (
                  <span className="font-medium">
                    {formatReactionCount(totalReactions)}
                  </span>
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="p-2 w-auto" 
          side="top"
          sideOffset={8}
        >
          <ReactionPicker
            postId={postId}
            onSelect={handleReactionSelect}
            currentReaction={currentReaction}
          />
        </PopoverContent>
      </Popover>
      
      {/* Reaction Summary */}
      {totalReactions > 0 && (
        <ReactionsSummary 
          reactions={reactionCounts}
          postId={postId}
          size={size}
        />
      )}
    </div>
  );
};

// Utility functions
const getReactionEmoji = (reactionType: string): string => {
  const emojiMap: Record<string, string> = {
    'thumbs_up': '👍',
    'love': '❤️',
    'mind_blown': '🤯',
    'thinking': '🤔',
    'support': '💪',
    'lightbulb': '💡',
    'fire': '🔥',
    'brain': '🧠',
    'trophy': '🏆'
  };
  
  return emojiMap[reactionType] || '👍';
};

const formatReactionCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
};
```

#### **2.2 Seletor de Reações (Picker)**
```typescript
// src/components/Reactions/ReactionPicker.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Reaction {
  type: string;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

const REACTIONS: Reaction[] = [
  { type: 'thumbs_up', emoji: '👍', label: 'Curtir', color: '#2196f3', description: 'Gostei / Concordo' },
  { type: 'love', emoji: '❤️', label: 'Amei', color: '#e91e63', description: 'Adorei este conteúdo!' },
  { type: 'mind_blown', emoji: '🤯', label: 'Incrível', color: '#ff9800', description: 'Nossa, que incrível!' },
  { type: 'thinking', emoji: '🤔', label: 'Pensativo', color: '#9c27b0', description: 'Me fez pensar...' },
  { type: 'support', emoji: '💪', label: 'Força!', color: '#4caf50', description: 'Você consegue!' },
  { type: 'lightbulb', emoji: '💡', label: 'Entendi!', color: '#ffc107', description: 'Agora faz sentido!' },
  { type: 'fire', emoji: '🔥', label: 'Fogo!', color: '#ff5722', description: 'Conteúdo top demais!' },
  { type: 'brain', emoji: '🧠', label: 'Inteligente', color: '#607d8b', description: 'Muito inteligente!' },
  { type: 'trophy', emoji: '🏆', label: 'Top!', color: '#ffd700', description: 'Nota 10!' }
];

interface ReactionPickerProps {
  postId: string;
  onSelect: (reactionType: string) => void;
  currentReaction?: string | null;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  postId,
  onSelect,
  currentReaction
}) => {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="flex items-center gap-1 p-2 bg-background rounded-full shadow-lg border"
      >
        {REACTIONS.map((reaction, index) => (
          <Tooltip key={reaction.type}>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  rotate: hoveredReaction === reaction.type ? [0, -5, 5, 0] : 0
                }}
                transition={{ 
                  delay: index * 0.05,
                  rotate: { duration: 0.3 }
                }}
                whileHover={{ 
                  scale: 1.3,
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center",
                  "transition-all duration-200 hover:shadow-lg",
                  currentReaction === reaction.type && "ring-2 ring-primary ring-offset-2",
                  "text-2xl cursor-pointer select-none"
                )}
                style={{
                  backgroundColor: hoveredReaction === reaction.type 
                    ? `${reaction.color}20` 
                    : 'transparent'
                }}
                onClick={() => onSelect(reaction.type)}
                onMouseEnter={() => setHoveredReaction(reaction.type)}
                onMouseLeave={() => setHoveredReaction(null)}
              >
                {reaction.emoji}
                
                {/* Glow effect on hover */}
                <AnimatePresence>
                  {hoveredReaction === reaction.type && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ backgroundColor: reaction.color }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            
            <TooltipContent 
              side="top" 
              className="text-xs font-medium"
              style={{ backgroundColor: reaction.color }}
            >
              <div className="text-center">
                <div className="font-semibold">{reaction.label}</div>
                <div className="text-xs opacity-90">{reaction.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </motion.div>
    </TooltipProvider>
  );
};
```

#### **2.3 Resumo de Reações**
```typescript
// src/components/Reactions/ReactionsSummary.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReactionUsers } from '@/hooks/useReactions';
import { formatTimeAgo } from '@/lib/utils';

interface ReactionsSummaryProps {
  reactions: Record<string, number>;
  postId: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ReactionsSummary: React.FC<ReactionsSummaryProps> = ({
  reactions,
  postId,
  size = 'md'
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('');
  
  // Ordenar reações por count (mais populares primeiro)
  const sortedReactions = Object.entries(reactions)
    .sort(([,a], [,b]) => b - a)
    .filter(([,count]) => count > 0);
  
  if (sortedReactions.length === 0) return null;
  
  // Mostrar até 3 reações mais populares no resumo
  const topReactions = sortedReactions.slice(0, 3);
  const totalCount = sortedReactions.reduce((sum, [,count]) => sum + count, 0);
  
  const reactionSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[size];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 hover:bg-muted rounded px-2 py-1 transition-colors">
          {/* Mostrar emojis das top 3 reações */}
          <div className="flex -space-x-1">
            {topReactions.map(([reactionType], index) => (
              <div 
                key={reactionType}
                className={cn(
                  "flex items-center justify-center rounded-full bg-background border-2 border-background",
                  reactionSize
                )}
                style={{ zIndex: 10 - index }}
              >
                {getReactionEmoji(reactionType)}
              </div>
            ))}
          </div>
          
          {/* Total count */}
          <span className="text-sm text-muted-foreground ml-1">
            {formatReactionCount(totalCount)}
          </span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reações</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          value={selectedTab || sortedReactions[0][0]} 
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 lg:grid-cols-4 gap-1 mb-4">
            {/* Tab "Todas" */}
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-1 text-xs"
            >
              <span>Todas</span>
              <span className="text-xs text-muted-foreground">
                {totalCount}
              </span>
            </TabsTrigger>
            
            {/* Tabs por tipo de reação */}
            {sortedReactions.slice(0, 6).map(([reactionType, count]) => (
              <TabsTrigger 
                key={reactionType}
                value={reactionType}
                className="flex items-center gap-1 text-xs"
              >
                <span>{getReactionEmoji(reactionType)}</span>
                <span className="text-xs text-muted-foreground">
                  {count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Conteúdo - Lista "Todas" */}
          <TabsContent value="all">
            <AllReactionsUsers postId={postId} />
          </TabsContent>
          
          {/* Conteúdo - Listas por tipo */}
          {sortedReactions.map(([reactionType]) => (
            <TabsContent key={reactionType} value={reactionType}>
              <ReactionTypeUsers 
                postId={postId} 
                reactionType={reactionType} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Componente para mostrar usuários de um tipo específico de reação
const ReactionTypeUsers: React.FC<{ postId: string; reactionType: string }> = ({
  postId,
  reactionType
}) => {
  const { data: users, isLoading } = useReactionUsers(postId, reactionType);
  
  if (isLoading) {
    return <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      ))}
    </div>;
  }
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {users?.map(user => (
        <div key={user.id} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.nickname[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.nickname}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(user.created_at)}
            </p>
          </div>
          
          <div className="text-lg">
            {getReactionEmoji(reactionType)}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### **2.4 Hook Customizado para Reações**
```typescript
// src/hooks/useReactions.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ReactToPostData {
  postId: string;
  reactionType: string;
}

export const useReactions = () => {
  const queryClient = useQueryClient();
  
  const reactToPost = useMutation({
    mutationFn: async ({ postId, reactionType }: ReactToPostData) => {
      const response = await api.post(`/api/posts/${postId}/react`, {
        reaction_type: reactionType
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Atualizar cache das reações do post
      queryClient.setQueryData(
        ['reactions', variables.postId],
        data.reaction_counts
      );
      
      // Atualizar cache do feed se necessário
      queryClient.invalidateQueries(['posts']);
      
      // Mostrar feedback visual
      if (data.action === 'created') {
        toast({
          description: "Reação adicionada!",
          duration: 1000
        });
      } else if (data.action === 'removed') {
        toast({
          description: "Reação removida",
          duration: 1000
        });
      } else {
        toast({
          description: "Reação atualizada!",
          duration: 1000
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reagir ao post. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  return { reactToPost, isLoading: reactToPost.isPending };
};

export const usePostReactions = (postId: string) => {
  return useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      const response = await api.get(`/api/posts/${postId}/reactions`);
      return response.data;
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false
  });
};

export const useReactionUsers = (postId: string, reactionType: string) => {
  return useQuery({
    queryKey: ['reaction-users', postId, reactionType],
    queryFn: async () => {
      const response = await api.get(
        `/api/posts/${postId}/reactions/${reactionType}/users`
      );
      return response.data.users;
    },
    enabled: !!postId && !!reactionType
  });
};

export const useSuggestedReactions = (postId: string) => {
  return useQuery({
    queryKey: ['suggested-reactions', postId],
    queryFn: async () => {
      const response = await api.get(`/api/posts/${postId}/suggested-reactions`);
      return response.data;
    },
    staleTime: 300000, // 5 minutos
    enabled: !!postId
  });
};
```

## 🎯 Analytics e Insights Avançados

### **1. Sistema de Analytics de Reações**
```typescript
// src/services/reactionAnalytics.ts
interface ReactionInsight {
  sentiment_score: number; // -1 a 1
  emotional_tone: 'positive' | 'negative' | 'neutral' | 'mixed';
  engagement_quality: 'high' | 'medium' | 'low';
  virality_potential: number; // 0 a 100
}

class ReactionAnalyticsService {
  // Analisar sentiment de um post baseado nas reações
  analyzePostSentiment(reactions: Record<string, number>): ReactionInsight {
    const reactionWeights = {
      'love': 0.9,
      'fire': 0.8,
      'trophy': 0.8,
      'thumbs_up': 0.6,
      'lightbulb': 0.5,
      'brain': 0.4,
      'support': 0.7,
      'thinking': 0.0, // Neutral
      'mind_blown': 0.3
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    Object.entries(reactions).forEach(([type, count]) => {
      const weight = reactionWeights[type] || 0;
      weightedSum += weight * count;
      totalWeight += count;
    });
    
    const sentimentScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
      sentiment_score: sentimentScore,
      emotional_tone: this.calculateEmotionalTone(sentimentScore, reactions),
      engagement_quality: this.calculateEngagementQuality(reactions),
      virality_potential: this.calculateViralityPotential(reactions)
    };
  }
  
  private calculateEmotionalTone(
    sentimentScore: number, 
    reactions: Record<string, number>
  ): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const diversity = Object.keys(reactions).length;
    
    if (diversity >= 4) return 'mixed';
    if (sentimentScore > 0.6) return 'positive';
    if (sentimentScore < 0.3) return 'negative';
    return 'neutral';
  }
  
  private calculateEngagementQuality(reactions: Record<string, number>): 'high' | 'medium' | 'low' {
    const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
    const diversityBonus = Object.keys(reactions).length * 0.2;
    const qualityScore = totalReactions + diversityBonus;
    
    if (qualityScore > 50) return 'high';
    if (qualityScore > 20) return 'medium';
    return 'low';
  }
  
  private calculateViralityPotential(reactions: Record<string, number>): number {
    // Posts com reações "fire" e "mind_blown" têm maior potencial viral
    const viralReactions = ['fire', 'mind_blown', 'trophy', 'love'];
    let viralScore = 0;
    
    Object.entries(reactions).forEach(([type, count]) => {
      if (viralReactions.includes(type)) {
        viralScore += count * 1.5;
      } else {
        viralScore += count * 0.5;
      }
    });
    
    return Math.min(100, viralScore * 2);
  }
}

export const reactionAnalytics = new ReactionAnalyticsService();
```

## 🚀 Plano de Implementação

### **Sprint 1 (Semanas 1-2): Backend Foundation**
- [ ] Migração do sistema de likes para reações
- [ ] Criação das novas tabelas (reactions, analytics, contexts)
- [ ] Implementação dos novos endpoints de API
- [ ] Sistema de analytics básico
- [ ] Testes unitários do backend

### **Sprint 2 (Semanas 3-4): Frontend Implementation**
- [ ] Componentes React para seletor de reações
- [ ] Animações e micro-interações
- [ ] Hook customizado para gerenciar reações
- [ ] Integração com o sistema existente de posts
- [ ] Testes E2E do fluxo completo

## 📊 Métricas de Sucesso

### **Métricas Técnicas**
- **Response Time**: < 200ms para reação
- **Cache Hit Rate**: > 85% para contadores
- **Error Rate**: < 0.05%
- **Animation Performance**: 60fps nas animações

### **Métricas de Produto**
- **Adoption Rate**: 75% dos usuários usam reações expandidas
- **Diversity Score**: Média de 2.8 tipos de reações por post
- **Engagement Lift**: +35% nas interações totais
- **User Satisfaction**: Rating 4.7/5 para nova feature

---

**Responsável Técnico:** Equipe Frontend + Backend  
**Timeline:** Q1 2025 (Sprints 1-2)  
**Dependencies:** Sistema atual de posts funcionando  

*O Sistema de Reações Expandidas criará uma linguagem emocional mais rica no Study Space, permitindo expressão autêntica e insights valiosos sobre o engajamento da comunidade.*