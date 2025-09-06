# Study Space - Sistema de Compartilhamento de Posts 🔄📤

## 📋 Visão Geral

O Sistema de Compartilhamento de Posts transformará a distribuição de conteúdo no Study Space, permitindo que usuários amplifiquem posts valiosos através de compartilhamentos internos e externos, criando efeito viral e aumentando significativamente o alcance de conteúdo educacional de qualidade.

**Prioridade:** Alta (RICE Score: 8.7)  
**Sprint:** 1-2 (Q1 2025)  
**Effort:** 3 sprints  
**Impact:** Alto (viral reach +180%, content discovery +65%)

## 🎯 Objetivos e KPIs

### **Objetivos Estratégicos**
- Aumentar alcance de posts de qualidade em 180%
- Facilitar descoberta de conteúdo educacional relevante
- Criar loops virais de compartilhamento de conhecimento
- Estabelecer Study Space como fonte de conteúdo compartilhável
- Implementar attribution tracking para criadores de conteúdo

### **KPIs Principais**
| Métrica | Baseline Atual | Meta Q1 2025 | Meta Q2 2025 |
|---------|---------------|---------------|---------------|
| Posts compartilhados/dia | 0 | 420 | 1,250 |
| Taxa de compartilhamento | 0% | 18% | 28% |
| Reach médio por post | 45 | 125 | 280 |
| Shares externos/dia | 0 | 180 | 520 |
| Viral coefficient | 1.0 | 1.4 | 1.8 |

### **Métricas de Viralidade**
- **Cascade Depth**: Quantos níveis de compartilhamento um post atinge
- **Share Velocity**: Velocidade de compartilhamento nas primeiras 24h
- **Cross-Platform Shares**: Compartilhamentos para outras redes sociais
- **Attribution Rate**: % de compartilhamentos que mantêm atribuição

## 🏗️ Arquitetura Técnica Completa

### **1. Backend Architecture**

#### **1.1 Modelo de Dados**
```sql
-- Tabela principal de compartilhamentos
CREATE TABLE post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    shared_post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Para reshares internos
    sharer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo e destino do compartilhamento
    share_type share_type_enum NOT NULL,
    platform platform_enum, -- Para shares externos
    
    -- Contexto do compartilhamento
    share_comment TEXT, -- Comentário pessoal do compartilhador
    share_context share_context_enum DEFAULT 'general',
    
    -- Tracking e analytics
    clicks_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0, -- Conversões (cadastros, etc.)
    attribution_maintained BOOLEAN DEFAULT true,
    
    -- Metadata
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Para shares temporários
    is_public BOOLEAN DEFAULT true,
    
    -- Índices para performance
    INDEX idx_post_shares_original (original_post_id, shared_at DESC),
    INDEX idx_post_shares_sharer (sharer_user_id, shared_at DESC),
    INDEX idx_post_shares_type (share_type, shared_at DESC),
    INDEX idx_post_shares_trending (shared_at DESC, clicks_count DESC)
);

-- Tipos de compartilhamento
CREATE TYPE share_type_enum AS ENUM (
    'internal_reshare',    -- Reshare dentro do Study Space
    'internal_quote',      -- Quote tweet style (com comentário)
    'external_link',       -- Link direto para o post
    'external_image',      -- Compartilhar como imagem
    'external_embed',      -- Embed widget
    'private_message',     -- Via DM interno
    'email_share',         -- Por email
    'copy_link'           -- Copiar link
);

-- Plataformas de compartilhamento externo
CREATE TYPE platform_enum AS ENUM (
    'whatsapp',
    'telegram',
    'twitter',
    'facebook',
    'instagram',
    'linkedin',
    'discord',
    'email',
    'sms',
    'clipboard'
);

-- Contexto do compartilhamento
CREATE TYPE share_context_enum AS ENUM (
    'general',
    'educational',
    'inspirational',
    'discussion',
    'recommendation',
    'news',
    'achievement'
);

-- Analytics de compartilhamento por post
CREATE TABLE post_share_analytics (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    
    -- Contadores por tipo
    total_shares INTEGER DEFAULT 0,
    internal_reshares INTEGER DEFAULT 0,
    external_shares INTEGER DEFAULT 0,
    quote_shares INTEGER DEFAULT 0,
    
    -- Métricas de alcance
    total_reach INTEGER DEFAULT 0,
    unique_sharers INTEGER DEFAULT 0,
    cascade_depth INTEGER DEFAULT 0,
    
    -- Performance temporal
    shares_24h INTEGER DEFAULT 0,
    shares_7d INTEGER DEFAULT 0,
    shares_30d INTEGER DEFAULT 0,
    
    -- Viral metrics
    viral_coefficient DECIMAL(3,2) DEFAULT 0.0,
    share_velocity DECIMAL(5,2) DEFAULT 0.0, -- shares per hour
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cascata de compartilhamentos (tracking viral spread)
CREATE TABLE share_cascade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    share_id UUID NOT NULL REFERENCES post_shares(id) ON DELETE CASCADE,
    parent_share_id UUID REFERENCES post_shares(id) ON DELETE CASCADE,
    
    -- Posição na cascata
    cascade_level INTEGER NOT NULL DEFAULT 1,
    cascade_path TEXT[], -- Array de IDs do caminho
    
    -- Métricas desta ramificação
    branch_shares INTEGER DEFAULT 0,
    branch_reach INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_share_cascade_post (original_post_id, cascade_level),
    INDEX idx_share_cascade_parent (parent_share_id, created_at DESC)
);

-- Configurações de compartilhamento por usuário
CREATE TABLE user_share_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permissões de compartilhamento
    allow_reshares BOOLEAN DEFAULT true,
    allow_external_shares BOOLEAN DEFAULT true,
    require_attribution BOOLEAN DEFAULT true,
    allow_quote_shares BOOLEAN DEFAULT true,
    
    -- Configurações de privacidade
    share_with_attribution_only BOOLEAN DEFAULT false,
    block_commercial_shares BOOLEAN DEFAULT true,
    
    -- Notificações
    notify_on_share BOOLEAN DEFAULT true,
    notify_on_viral_reach BOOLEAN DEFAULT true,
    
    -- Analytics opt-in
    share_analytics_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates de compartilhamento personalizado
CREATE TABLE share_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    
    -- Template content
    title_template TEXT,
    description_template TEXT,
    hashtags TEXT[],
    
    -- Configurações
    platform_specific JSONB, -- Configurações específicas por plataforma
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_share_templates_user (user_id, is_active)
);

-- Triggers para manter analytics atualizados
CREATE OR REPLACE FUNCTION update_share_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Atualizar analytics do post original
        INSERT INTO post_share_analytics (post_id, total_shares, last_updated)
        VALUES (NEW.original_post_id, 1, NOW())
        ON CONFLICT (post_id) 
        DO UPDATE SET 
            total_shares = post_share_analytics.total_shares + 1,
            internal_reshares = CASE 
                WHEN NEW.share_type IN ('internal_reshare', 'internal_quote') 
                THEN post_share_analytics.internal_reshares + 1 
                ELSE post_share_analytics.internal_reshares 
            END,
            external_shares = CASE 
                WHEN NEW.share_type NOT IN ('internal_reshare', 'internal_quote') 
                THEN post_share_analytics.external_shares + 1 
                ELSE post_share_analytics.external_shares 
            END,
            quote_shares = CASE 
                WHEN NEW.share_type = 'internal_quote' 
                THEN post_share_analytics.quote_shares + 1 
                ELSE post_share_analytics.quote_shares 
            END,
            last_updated = NOW();
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contadores
        UPDATE post_share_analytics 
        SET 
            total_shares = GREATEST(0, total_shares - 1),
            internal_reshares = CASE 
                WHEN OLD.share_type IN ('internal_reshare', 'internal_quote') 
                THEN GREATEST(0, internal_reshares - 1) 
                ELSE internal_reshares 
            END,
            external_shares = CASE 
                WHEN OLD.share_type NOT IN ('internal_reshare', 'internal_quote') 
                THEN GREATEST(0, external_shares - 1) 
                ELSE external_shares 
            END,
            last_updated = NOW()
        WHERE post_id = OLD.original_post_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_analytics_trigger
    AFTER INSERT OR DELETE ON post_shares
    FOR EACH ROW EXECUTE FUNCTION update_share_analytics();
```

#### **1.2 API Endpoints**

##### **Core Sharing Endpoints**
```javascript
// routes/shares.js
const express = require('express');
const router = express.Router();
const sharesController = require('../controllers/sharesController');
const authenticateToken = require('../middleware/authenticateToken');
const rateLimiter = require('../middleware/rateLimiter');
const validateShare = require('../middleware/validateShare');

// Compartilhar post
router.post('/posts/:postId/share',
    authenticateToken,
    rateLimiter.sharing, // 50 shares por hora
    validateShare,
    sharesController.sharePost
);

// Buscar shares de um post
router.get('/posts/:postId/shares',
    authenticateToken,
    sharesController.getPostShares
);

// Buscar posts compartilhados por um usuário
router.get('/users/:userId/shares',
    authenticateToken,
    sharesController.getUserShares
);

// Analytics de compartilhamento
router.get('/posts/:postId/share-analytics',
    authenticateToken,
    sharesController.getShareAnalytics
);

// Gerar link de compartilhamento público
router.post('/posts/:postId/share-link',
    authenticateToken,
    sharesController.generateShareLink
);

// Tracking de clicks em shares
router.post('/shares/:shareId/track-click',
    rateLimiter.tracking, // 1000 tracks por minuto
    sharesController.trackShareClick
);

// Configurações de compartilhamento
router.get('/share-preferences',
    authenticateToken,
    sharesController.getSharePreferences
);

router.put('/share-preferences',
    authenticateToken,
    sharesController.updateSharePreferences
);

// Templates de compartilhamento
router.get('/share-templates',
    authenticateToken,
    sharesController.getShareTemplates
);

router.post('/share-templates',
    authenticateToken,
    sharesController.createShareTemplate
);

module.exports = router;
```

#### **1.3 Controller Implementation**
```javascript
// controllers/sharesController.js
const db = require('../config/database');
const { generateShareContent } = require('../services/shareContentGenerator');
const { sendShareNotification } = require('../services/notificationService');
const { trackEvent } = require('../services/analytics');
const { validateSharePermissions } = require('../services/sharePermissions');

const sharesController = {
    async sharePost(req, res) {
        try {
            const { postId } = req.params;
            const { 
                share_type, 
                platform, 
                share_comment, 
                share_context = 'general',
                attribution_required = true 
            } = req.body;
            const sharerId = req.user.id;
            
            // Verificar se o post existe e é compartilhável
            const post = await db.query(`
                SELECT p.*, u.nickname as author_nickname,
                       ups.allow_reshares, ups.allow_external_shares, 
                       ups.require_attribution
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN user_share_preferences ups ON p.user_id = ups.user_id
                WHERE p.id = $1
            `, [postId]);
            
            if (post.rows.length === 0) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }
            
            const originalPost = post.rows[0];
            
            // Validar permissões de compartilhamento
            const canShare = await validateSharePermissions(
                originalPost, 
                share_type, 
                sharerId
            );
            
            if (!canShare.allowed) {
                return res.status(403).json({ 
                    error: canShare.reason || 'Não é possível compartilhar este post' 
                });
            }
            
            // Preparar dados do share
            const shareData = {
                original_post_id: postId,
                sharer_user_id: sharerId,
                share_type,
                platform,
                share_comment,
                share_context,
                attribution_maintained: attribution_required
            };
            
            let createdShare;
            
            // Para reshares internos, criar um novo post
            if (share_type === 'internal_reshare' || share_type === 'internal_quote') {
                const sharedPost = await createInternalShare(originalPost, shareData, req.user);
                shareData.shared_post_id = sharedPost.id;
            }
            
            // Criar registro de compartilhamento
            const shareResult = await db.query(`
                INSERT INTO post_shares (
                    original_post_id, shared_post_id, sharer_user_id, 
                    share_type, platform, share_comment, share_context, 
                    attribution_maintained
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                shareData.original_post_id,
                shareData.shared_post_id,
                shareData.sharer_user_id,
                shareData.share_type,
                shareData.platform,
                shareData.share_comment,
                shareData.share_context,
                shareData.attribution_maintained
            ]);
            
            createdShare = shareResult.rows[0];
            
            // Atualizar cascade se for um reshare
            if (shareData.shared_post_id) {
                await updateShareCascade(createdShare, originalPost);
            }
            
            // Gerar conteúdo de compartilhamento personalizado
            const shareContent = await generateShareContent(
                originalPost, 
                createdShare, 
                req.user
            );
            
            // Notificar autor original
            if (originalPost.user_id !== sharerId) {
                await sendShareNotification(originalPost, createdShare, req.user);
            }
            
            // Analytics
            await trackEvent('post_shared', {
                original_post_id: postId,
                sharer_user_id: sharerId,
                share_type: share_type,
                platform: platform,
                has_comment: !!share_comment
            });
            
            res.json({
                success: true,
                share: createdShare,
                share_content: shareContent,
                shared_post_id: shareData.shared_post_id
            });
            
        } catch (error) {
            console.error('Error sharing post:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getShareAnalytics(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user.id;
            
            // Verificar se o usuário pode ver analytics
            const post = await db.query(
                'SELECT user_id FROM posts WHERE id = $1',
                [postId]
            );
            
            if (post.rows.length === 0) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }
            
            // Só o autor do post pode ver analytics detalhados
            const isAuthor = post.rows[0].user_id === userId;
            
            // Buscar analytics básicos
            const analytics = await db.query(`
                SELECT * FROM post_share_analytics WHERE post_id = $1
            `, [postId]);
            
            let detailedAnalytics = null;
            
            if (isAuthor) {
                // Analytics detalhados para o autor
                detailedAnalytics = await db.query(`
                    SELECT 
                        ps.share_type,
                        ps.platform,
                        ps.share_context,
                        COUNT(*) as count,
                        SUM(ps.clicks_count) as total_clicks,
                        AVG(ps.clicks_count) as avg_clicks_per_share
                    FROM post_shares ps
                    WHERE ps.original_post_id = $1
                    GROUP BY ps.share_type, ps.platform, ps.share_context
                    ORDER BY count DESC
                `, [postId]);
                
                // Top sharers
                const topSharers = await db.query(`
                    SELECT 
                        u.id, u.nickname, u.avatar_url,
                        COUNT(ps.id) as shares_count,
                        SUM(ps.clicks_count) as total_clicks_generated
                    FROM post_shares ps
                    JOIN users u ON ps.sharer_user_id = u.id
                    WHERE ps.original_post_id = $1
                    GROUP BY u.id, u.nickname, u.avatar_url
                    ORDER BY shares_count DESC, total_clicks_generated DESC
                    LIMIT 10
                `, [postId]);
                
                detailedAnalytics = {
                    breakdown: detailedAnalytics.rows,
                    top_sharers: topSharers.rows
                };
            }
            
            res.json({
                success: true,
                analytics: analytics.rows[0] || {
                    total_shares: 0,
                    internal_reshares: 0,
                    external_shares: 0,
                    quote_shares: 0,
                    total_reach: 0
                },
                detailed_analytics: detailedAnalytics
            });
            
        } catch (error) {
            console.error('Error getting share analytics:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async generateShareLink(req, res) {
        try {
            const { postId } = req.params;
            const { 
                platform = 'general',
                include_preview = true,
                expires_in_hours = 0 // 0 = never expires
            } = req.body;
            const sharerId = req.user.id;
            
            // Verificar permissões de compartilhamento
            const post = await db.query(`
                SELECT p.*, u.nickname as author_nickname
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = $1
            `, [postId]);
            
            if (post.rows.length === 0) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }
            
            // Gerar link único de compartilhamento
            const shareToken = generateShareToken();
            const expiresAt = expires_in_hours > 0 
                ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
                : null;
            
            // Criar share tracking
            const shareResult = await db.query(`
                INSERT INTO post_shares (
                    original_post_id, sharer_user_id, share_type, 
                    platform, expires_at
                )
                VALUES ($1, $2, 'external_link', $3, $4)
                RETURNING *
            `, [postId, sharerId, platform, expiresAt]);
            
            const shareId = shareResult.rows[0].id;
            
            // Gerar URLs específicas da plataforma
            const baseUrl = process.env.FRONTEND_URL || 'https://studyspace.com';
            const shareUrl = `${baseUrl}/shared/${shareId}?token=${shareToken}`;
            
            const platformUrls = generatePlatformUrls(shareUrl, post.rows[0], platform);
            
            res.json({
                success: true,
                share_id: shareId,
                share_url: shareUrl,
                platform_urls: platformUrls,
                expires_at: expiresAt,
                preview_enabled: include_preview
            });
            
        } catch (error) {
            console.error('Error generating share link:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async trackShareClick(req, res) {
        try {
            const { shareId } = req.params;
            const { 
                referrer, 
                user_agent, 
                ip_address,
                converted = false 
            } = req.body;
            
            // Atualizar contador de clicks
            await db.query(`
                UPDATE post_shares 
                SET 
                    clicks_count = clicks_count + 1,
                    conversion_count = CASE WHEN $2 THEN conversion_count + 1 ELSE conversion_count END
                WHERE id = $1
            `, [shareId, converted]);
            
            // Analytics detalhados
            await trackEvent('share_clicked', {
                share_id: shareId,
                referrer: referrer,
                user_agent: user_agent,
                converted: converted
            });
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('Error tracking share click:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

// Função auxiliar para criar reshare interno
async function createInternalShare(originalPost, shareData, sharer) {
    let content = '';
    
    if (shareData.share_type === 'internal_quote' && shareData.share_comment) {
        content = shareData.share_comment + '\n\n';
    }
    
    // Adicionar referência ao post original
    content += `🔄 Compartilhado de @${originalPost.author_nickname}`;
    
    const sharedPost = await db.query(`
        INSERT INTO posts (
            user_id, type, content, original_post_id, 
            is_reshare, created_at
        )
        VALUES ($1, 'reshare', $2, $3, true, NOW())
        RETURNING *
    `, [
        sharer.id,
        content,
        originalPost.id
    ]);
    
    return sharedPost.rows[0];
}

// Função auxiliar para atualizar cascade
async function updateShareCascade(share, originalPost) {
    // Determinar o nível da cascata
    let cascadeLevel = 1;
    let parentShareId = null;
    
    // Se o post original é um reshare, continuar a cascata
    if (originalPost.is_reshare && originalPost.original_post_id) {
        const parentCascade = await db.query(`
            SELECT cascade_level, id as parent_share_id
            FROM share_cascade 
            WHERE share_id = (
                SELECT id FROM post_shares 
                WHERE shared_post_id = $1 
                LIMIT 1
            )
        `, [originalPost.id]);
        
        if (parentCascade.rows.length > 0) {
            cascadeLevel = parentCascade.rows[0].cascade_level + 1;
            parentShareId = parentCascade.rows[0].parent_share_id;
        }
    }
    
    // Criar entrada na cascata
    await db.query(`
        INSERT INTO share_cascade (
            original_post_id, share_id, parent_share_id, cascade_level
        )
        VALUES ($1, $2, $3, $4)
    `, [
        originalPost.original_post_id || originalPost.id,
        share.id,
        parentShareId,
        cascadeLevel
    ]);
}

module.exports = sharesController;
```

### **2. Frontend Implementation**

#### **2.1 Componente Principal de Compartilhamento**
```typescript
// src/components/Sharing/ShareButton.tsx
import React, { useState } from 'react';
import { Share2, ExternalLink, MessageSquare, Copy, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useShare } from '@/hooks/useSharing';
import { ShareModal } from './ShareModal';
import { QuoteShareModal } from './QuoteShareModal';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    type: string;
    author_nickname: string;
    media_urls?: string[];
  };
  shareCount?: number;
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  post,
  shareCount = 0,
  variant = 'button',
  className
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { sharePost, generateShareLink, isLoading } = useShare();

  const handleQuickShare = async (shareType: string, platform?: string) => {
    try {
      await sharePost.mutateAsync({
        postId: post.id,
        shareType,
        platform
      });
      
      toast({
        title: "Post compartilhado!",
        description: "O post foi compartilhado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o post. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const result = await generateShareLink.mutateAsync({
        postId: post.id,
        platform: 'clipboard'
      });
      
      await navigator.clipboard.writeText(result.share_url);
      
      toast({
        title: "Link copiado!",
        description: "O link do post foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShareModal(true)}
        className={className}
        disabled={isLoading}
      >
        <Share2 className="h-4 w-4 mr-1" />
        {shareCount > 0 && <span className="text-xs">{shareCount}</span>}
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={className}>
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleQuickShare('internal_reshare')}>
              <Share2 className="h-4 w-4 mr-2" />
              Reshare
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowQuoteModal(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Quote Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowShareModal(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Compartilhar externamente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <QuoteShareModal
          post={post}
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
        />

        <ShareModal
          post={post}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className} disabled={isLoading}>
            <Share2 className="h-4 w-4 mr-1" />
            Compartilhar
            {shareCount > 0 && (
              <span className="ml-2 text-xs bg-muted rounded px-1">
                {shareCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleQuickShare('internal_reshare')}>
            <Share2 className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Reshare</span>
              <span className="text-xs text-muted-foreground">
                Compartilhar no seu feed
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowQuoteModal(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Quote Share</span>
              <span className="text-xs text-muted-foreground">
                Adicionar seu comentário
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowShareModal(true)}>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Mais opções
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuoteShareModal
        post={post}
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />

      <ShareModal
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};
```

#### **2.2 Modal de Compartilhamento Avançado**
```typescript
// src/components/Sharing/ShareModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  WhatsappIcon, 
  TelegramIcon, 
  TwitterIcon, 
  FacebookIcon,
  LinkedinIcon,
  InstagramIcon,
  DiscordIcon,
  MailIcon,
  LinkIcon,
  MessageSquareIcon
} from '@/components/icons/SocialIcons';
import { useShare } from '@/hooks/useSharing';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  maxLength?: number;
  supportsMedia: boolean;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: WhatsappIcon,
    color: '#25D366',
    description: 'Compartilhar via WhatsApp',
    maxLength: 1000,
    supportsMedia: true
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: TelegramIcon,
    color: '#0088CC',
    description: 'Compartilhar via Telegram',
    maxLength: 1000,
    supportsMedia: true
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: TwitterIcon,
    color: '#1DA1F2',
    description: 'Compartilhar no Twitter',
    maxLength: 280,
    supportsMedia: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    color: '#1877F2',
    description: 'Compartilhar no Facebook',
    supportsMedia: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedinIcon,
    color: '#0A66C2',
    description: 'Compartilhar no LinkedIn',
    maxLength: 1300,
    supportsMedia: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    color: '#E4405F',
    description: 'Compartilhar no Instagram Stories',
    supportsMedia: true
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: DiscordIcon,
    color: '#5865F2',
    description: 'Compartilhar no Discord',
    maxLength: 2000,
    supportsMedia: true
  },
  {
    id: 'email',
    name: 'Email',
    icon: MailIcon,
    color: '#EA4335',
    description: 'Compartilhar por email',
    supportsMedia: false
  }
];

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  isOpen,
  onClose
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [generatePreview, setGeneratePreview] = useState(true);
  
  const { sharePost, generateShareLink, isLoading } = useShare();

  const handlePlatformShare = async (platformId: string) => {
    try {
      const result = await generateShareLink.mutateAsync({
        postId: post.id,
        platform: platformId,
        includePreview: generatePreview,
        customMessage: customMessage,
        includeAttribution: includeAttribution
      });

      // Abrir URL específica da plataforma
      if (result.platform_urls?.[platformId]) {
        window.open(result.platform_urls[platformId], '_blank');
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(result.share_url);
        toast({
          title: "Link copiado!",
          description: "Cole o link na plataforma desejada.",
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível gerar o link de compartilhamento.",
        variant: "destructive",
      });
    }
  };

  const selectedPlatformConfig = PLATFORMS.find(p => p.id === selectedPlatform);
  const isMessageTooLong = selectedPlatformConfig?.maxLength && 
    customMessage.length > selectedPlatformConfig.maxLength;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Post</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="customize">Personalizar</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map((platform) => (
                <Button
                  key={platform.id}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary"
                  onClick={() => handlePlatformShare(platform.id)}
                  disabled={isLoading}
                >
                  <platform.icon 
                    className="h-6 w-6" 
                    style={{ color: platform.color }} 
                  />
                  <span className="text-xs font-medium">{platform.name}</span>
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Ações Rápidas
              </Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePlatformShare('copy_link')}
                  disabled={isLoading}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePlatformShare('private_message')}
                  disabled={isLoading}
                >
                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                  Enviar DM
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform-select">Plataforma</Label>
                <select
                  id="platform-select"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Selecione uma plataforma</option>
                  {PLATFORMS.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="custom-message">
                  Mensagem Personalizada
                  {selectedPlatformConfig?.maxLength && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({customMessage.length}/{selectedPlatformConfig.maxLength})
                    </span>
                  )}
                </Label>
                <Textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Adicione uma mensagem pessoal..."
                  className={`mt-1 ${isMessageTooLong ? 'border-red-500' : ''}`}
                  maxLength={selectedPlatformConfig?.maxLength}
                />
                {isMessageTooLong && (
                  <p className="text-sm text-red-500 mt-1">
                    Mensagem muito longa para esta plataforma
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-attribution"
                  checked={includeAttribution}
                  onCheckedChange={setIncludeAttribution}
                />
                <Label htmlFor="include-attribution">
                  Incluir atribuição ao autor original
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="generate-preview"
                  checked={generatePreview}
                  onCheckedChange={setGeneratePreview}
                />
                <Label htmlFor="generate-preview">
                  Gerar preview do post
                </Label>
              </div>

              {selectedPlatform && (
                <Button
                  onClick={() => handlePlatformShare(selectedPlatform)}
                  disabled={isLoading || !selectedPlatform || isMessageTooLong}
                  className="w-full"
                >
                  {isLoading ? 'Gerando...' : `Compartilhar no ${selectedPlatformConfig?.name}`}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-expiry">Link expira em (horas)</Label>
                <Input
                  id="share-expiry"
                  type="number"
                  placeholder="0 = nunca expira"
                  min="0"
                  max="168"
                />
              </div>

              <div className="space-y-2">
                <Label>Contexto do Compartilhamento</Label>
                <div className="flex flex-wrap gap-2">
                  {['educational', 'inspirational', 'discussion', 'recommendation'].map((context) => (
                    <Badge key={context} variant="outline" className="cursor-pointer">
                      {context}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Preview do Compartilhamento</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Título:</strong> Post do Study Space</p>
                  <p><strong>Autor:</strong> @{post.author_nickname}</p>
                  <p><strong>Conteúdo:</strong> {post.content.substring(0, 100)}...</p>
                  {includeAttribution && (
                    <p className="text-xs text-muted-foreground">
                      Compartilhado via Study Space
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
```

## 🔄 Sistema de Reshare Interno

### **1. Componente de Quote Share**
```typescript
// src/components/Sharing/QuoteShareModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useShare } from '@/hooks/useSharing';
import { formatTimeAgo } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface QuoteShareModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteShareModal: React.FC<QuoteShareModalProps> = ({
  post,
  isOpen,
  onClose
}) => {
  const [comment, setComment] = useState('');
  const { sharePost, isLoading } = useShare();

  const handleQuoteShare = async () => {
    if (!comment.trim()) {
      toast({
        title: "Adicione um comentário",
        description: "Quote shares precisam de um comentário pessoal.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sharePost.mutateAsync({
        postId: post.id,
        shareType: 'internal_quote',
        shareComment: comment.trim(),
        shareContext: 'discussion'
      });

      toast({
        title: "Quote share criado!",
        description: "Seu post com comentário foi compartilhado no feed.",
      });

      onClose();
      setComment('');
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível criar o quote share.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quote Share</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment input */}
          <div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione seu comentário sobre este post..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {comment.length}/500
            </div>
          </div>

          {/* Original post preview */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author_avatar_url} />
                  <AvatarFallback>
                    {post.author_nickname[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      @{post.author_nickname}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.content}
                  </p>
                  
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        📷 {post.media_urls.length} imagem(ns)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleQuoteShare}
              disabled={isLoading || !comment.trim()}
            >
              {isLoading ? 'Compartilhando...' : 'Quote Share'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## 📊 Analytics de Compartilhamento

### **1. Dashboard de Métricas de Shares**
```typescript
// src/components/Sharing/ShareAnalytics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Share2, 
  ExternalLink, 
  MessageSquare,
  Users,
  Clock
} from 'lucide-react';
import { useShareAnalytics } from '@/hooks/useSharing';

interface ShareAnalyticsProps {
  postId: string;
  isAuthor: boolean;
}

export const ShareAnalytics: React.FC<ShareAnalyticsProps> = ({
  postId,
  isAuthor
}) => {
  const { data: analytics, isLoading } = useShareAnalytics(postId);

  if (isLoading) {
    return <ShareAnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum compartilhamento ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Shares"
          value={analytics.total_shares}
          icon={<Share2 className="h-4 w-4" />}
          color="blue"
        />
        
        <StatCard
          title="Reshares"
          value={analytics.internal_reshares}
          icon={<MessageSquare className="h-4 w-4" />}
          color="green"
        />
        
        <StatCard
          title="Links Externos"
          value={analytics.external_shares}
          icon={<ExternalLink className="h-4 w-4" />}
          color="purple"
        />
        
        <StatCard
          title="Alcance Total"
          value={analytics.total_reach}
          icon={<Users className="h-4 w-4" />}
          color="orange"
        />
      </div>

      {/* Viral Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Métricas de Viralidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Coeficiente Viral</span>
                <span className="font-medium">
                  {analytics.viral_coefficient.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={Math.min(analytics.viral_coefficient * 50, 100)} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Profundidade</span>
                <span className="font-medium">
                  {analytics.cascade_depth} níveis
                </span>
              </div>
              <Progress 
                value={Math.min(analytics.cascade_depth * 20, 100)} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Velocidade</span>
                <span className="font-medium">
                  {analytics.share_velocity.toFixed(1)}/h
                </span>
              </div>
              <Progress 
                value={Math.min(analytics.share_velocity * 10, 100)} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics (Author Only) */}
      {isAuthor && analytics.detailed_analytics && (
        <div className="space-y-4">
          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Compartilhamentos por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.detailed_analytics.breakdown.map((item) => (
                  <div key={`${item.share_type}-${item.platform}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.platform || item.share_type}
                      </Badge>
                      <span className="text-sm">
                        {item.count} shares
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.total_clicks} clicks
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Sharers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Principais Compartilhadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.detailed_analytics.top_sharers.map((sharer) => (
                  <div key={sharer.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                        {sharer.nickname[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">
                        @{sharer.nickname}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {sharer.shares_count} shares
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sharer.total_clicks_generated} clicks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`text-${color}-500`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## 🚀 Plano de Implementação

### **Sprint 1 (Semanas 1-2): Backend Core**
- [ ] Modelo de dados de compartilhamentos
- [ ] APIs básicas de share/reshare
- [ ] Sistema de tracking de cascata viral
- [ ] Analytics básicos de compartilhamento

### **Sprint 2 (Semanas 3-4): Frontend Implementation**
- [ ] Componente ShareButton com dropdown
- [ ] Modal de compartilhamento avançado
- [ ] Quote Share functionality
- [ ] Links de compartilhamento externos

### **Sprint 3 (Semanas 5-6): Advanced Features**
- [ ] Analytics dashboard para autores
- [ ] Templates de compartilhamento
- [ ] Configurações de privacidade
- [ ] Otimizações de performance

## 📊 Métricas de Sucesso

### **Métricas Técnicas**
- **Share Processing Time**: < 100ms para criar share
- **Link Generation**: < 200ms para gerar links externos
- **Click Tracking**: < 50ms para registrar clicks
- **Cascade Computation**: < 500ms para calcular cascata

### **Métricas de Produto**
- **Daily Shares**: 420 compartilhamentos por dia até fim Q1
- **Viral Coefficient**: 1.4 (cada post gera 1.4 novos shares)
- **External Reach**: 180 shares externos por dia
- **User Adoption**: 45% dos usuários compartilham posts

---

**Responsável Técnico:** Equipe Full-Stack  
**Timeline:** Q1 2025 (Sprints 1-3)  
**Dependencies:** Sistema de posts atual, Analytics básicos  

*O Sistema de Compartilhamento criará loops virais que amplificarão o alcance de conteúdo educacional de qualidade, transformando o Study Space em uma plataforma de distribuição de conhecimento.*