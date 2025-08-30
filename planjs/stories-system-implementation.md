# Study Space - Sistema de Stories 24h 📸

## 📋 Visão Geral

O Sistema de Stories 24h é uma funcionalidade crítica que transformará o Study Space em uma plataforma mais dinâmica e engajante, permitindo que usuários compartilhem momentos de estudos, conquistas e insights de forma efêmera, aumentando significativamente o engajamento diário e a retenção de usuários.

**Prioridade:** Crítica (RICE Score: 11.2)  
**Sprint:** 1-2 (Q1 2025)  
**Effort:** 4 sprints  
**Impact:** Alto (engagement +40%)

## 🎯 Objetivos e KPIs

### **Objetivos Estratégicos**
- Aumentar o engagement diário em 40%
- Reduzir bounce rate em 25%
- Aumentar tempo médio de sessão para 18 minutos
- Criar FOMO (Fear of Missing Out) que impulsiona retorno diário
- Estabelecer Study Space como plataforma "viciante" para estudantes

### **KPIs Principais**
| Métrica | Baseline Atual | Meta Q1 2025 | Meta Q2 2025 |
|---------|---------------|---------------|---------------|
| Stories criados/dia | 0 | 2,500 | 8,000 |
| Visualizações/story | 0 | 45 | 120 |
| DAU (Daily Active) | 2,000 | 5,000 | 15,000 |
| Session Duration | 8 min | 15 min | 25 min |
| Story Completion Rate | 0 | 75% | 85% |

### **Métricas Secundárias**
- Tempo médio assistindo stories: 12 segundos
- Taxa de interação com stories: 35%
- Stories respondidos via DM: 20%
- Retention D1: 65% → 80%

## 🏗️ Arquitetura Técnica Completa

### **1. Backend Architecture**

#### **1.1 Modelo de Dados**
```sql
-- Tabela principal de Stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type story_type NOT NULL DEFAULT 'image',
    content_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    duration INTEGER DEFAULT 15, -- segundos
    background_color VARCHAR(7) DEFAULT '#000000',
    font_style VARCHAR(50) DEFAULT 'default',
    
    -- Configurações de privacidade
    visibility visibility_type DEFAULT 'friends',
    viewers_can_reply BOOLEAN DEFAULT true,
    
    -- Métricas
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices
    INDEX idx_stories_user_created (user_id, created_at DESC),
    INDEX idx_stories_expires (expires_at),
    INDEX idx_stories_visibility (visibility, created_at DESC)
);

-- Tipos enumerados
CREATE TYPE story_type AS ENUM (
    'image',
    'video', 
    'text',
    'study_session',
    'achievement',
    'poll',
    'question_sticker'
);

CREATE TYPE visibility_type AS ENUM (
    'public',
    'friends', 
    'close_friends',
    'private'
);

-- Visualizações de Stories
CREATE TABLE story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_duration INTEGER DEFAULT 0, -- segundos assistidos
    
    UNIQUE(story_id, viewer_id),
    INDEX idx_story_views_story (story_id, viewed_at DESC),
    INDEX idx_story_views_viewer (viewer_id, viewed_at DESC)
);

-- Respostas/Replies aos Stories
CREATE TABLE story_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_type reply_type NOT NULL,
    content TEXT,
    media_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_story_replies_story (story_id, created_at DESC),
    INDEX idx_story_replies_sender (sender_id, created_at DESC)
);

CREATE TYPE reply_type AS ENUM (
    'text',
    'image', 
    'emoji_reaction',
    'voice_note'
);

-- Highlights de Stories (para futuro)
CREATE TABLE story_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    cover_story_id UUID REFERENCES stories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE highlight_stories (
    highlight_id UUID REFERENCES story_highlights(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (highlight_id, story_id)
);
```

#### **1.2 API Endpoints**

##### **Criação e Gestão de Stories**
```javascript
// POST /api/stories - Criar novo story
router.post('/stories', 
    authenticateToken,
    upload.single('media'), // multer para upload
    validateStoryCreation,
    storiesController.createStory
);

// GET /api/stories/feed - Feed de stories de amigos
router.get('/stories/feed',
    authenticateToken,
    storiesController.getStoriesFeed
);

// GET /api/stories/user/:userId - Stories de um usuário específico
router.get('/stories/user/:userId',
    authenticateToken,
    validateUserAccess,
    storiesController.getUserStories
);

// DELETE /api/stories/:id - Deletar story
router.delete('/stories/:id',
    authenticateToken,
    validateStoryOwner,
    storiesController.deleteStory
);
```

##### **Visualizações e Interações**
```javascript
// POST /api/stories/:id/view - Marcar story como visualizado
router.post('/stories/:id/view',
    authenticateToken,
    rateLimiter.view, // prevent spam
    storiesController.viewStory
);

// GET /api/stories/:id/viewers - Lista de quem visualizou
router.get('/stories/:id/viewers',
    authenticateToken,
    validateStoryAccess,
    storiesController.getViewers
);

// POST /api/stories/:id/reply - Responder story
router.post('/stories/:id/reply',
    authenticateToken,
    upload.single('media'),
    validateReplyContent,
    storiesController.replyToStory
);

// GET /api/stories/replies/received - Respostas recebidas
router.get('/stories/replies/received',
    authenticateToken,
    storiesController.getReceivedReplies
);
```

##### **Analytics e Insights**
```javascript
// GET /api/stories/analytics/my - Analytics dos meus stories
router.get('/stories/analytics/my',
    authenticateToken,
    storiesController.getMyAnalytics
);

// POST /api/stories/analytics/event - Track evento específico
router.post('/stories/analytics/event',
    authenticateToken,
    validateAnalyticsEvent,
    storiesController.trackEvent
);
```

#### **1.3 Controllers Implementation**

```javascript
// src/controllers/storiesController.js
const storiesController = {
    async createStory(req, res) {
        try {
            const { type, caption, duration, visibility, background_color } = req.body;
            const userId = req.user.id;
            const mediaFile = req.file;
            
            // Validações
            if (!mediaFile && type !== 'text') {
                return res.status(400).json({ 
                    error: 'Mídia obrigatória para este tipo de story' 
                });
            }
            
            // Upload para CDN (AWS S3/Cloudinary)
            let contentUrl = null;
            let thumbnailUrl = null;
            
            if (mediaFile) {
                const uploadResult = await uploadToS3(mediaFile, userId);
                contentUrl = uploadResult.url;
                
                // Gerar thumbnail para vídeos
                if (type === 'video') {
                    thumbnailUrl = await generateVideoThumbnail(contentUrl);
                }
            }
            
            // Criar story no database
            const story = await db.query(`
                INSERT INTO stories (
                    user_id, type, content_url, thumbnail_url, 
                    caption, duration, visibility, background_color
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                userId, type, contentUrl, thumbnailUrl,
                caption, duration, visibility, background_color
            ]);
            
            // Notificar amigos via WebSocket
            const friends = await getFriendsList(userId);
            friends.forEach(friend => {
                io.to(`user_${friend.id}`).emit('new_story', {
                    story: story.rows[0],
                    user: req.user
                });
            });
            
            // Analytics
            await trackEvent('story_created', {
                user_id: userId,
                story_type: type,
                story_id: story.rows[0].id
            });
            
            res.status(201).json({
                success: true,
                story: story.rows[0]
            });
            
        } catch (error) {
            logger.error('Error creating story:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getStoriesFeed(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 20, offset = 0 } = req.query;
            
            // Buscar stories de amigos + próprios stories
            const stories = await db.query(`
                SELECT DISTINCT ON (s.user_id) s.*, u.nickname, u.avatar_url,
                       CASE WHEN sv.viewer_id IS NOT NULL THEN true ELSE false END as viewed_by_me,
                       COUNT(sv2.viewer_id) as views_count
                FROM stories s
                JOIN users u ON s.user_id = u.id
                JOIN connections c ON (
                    (c.user1_id = $1 AND c.user2_id = s.user_id) OR
                    (c.user2_id = $1 AND c.user1_id = s.user_id) OR
                    s.user_id = $1
                ) AND c.status = 'accepted'
                LEFT JOIN story_views sv ON s.id = sv.story_id AND sv.viewer_id = $1
                LEFT JOIN story_views sv2 ON s.id = sv2.story_id
                WHERE s.expires_at > NOW()
                  AND (
                    s.visibility = 'public' OR
                    s.visibility = 'friends' OR
                    (s.visibility = 'close_friends' AND s.user_id IN (
                        SELECT cf.friend_id FROM close_friends cf WHERE cf.user_id = s.user_id
                    ))
                  )
                GROUP BY s.id, u.id, sv.viewer_id
                ORDER BY s.user_id, s.created_at DESC
                LIMIT $2 OFFSET $3
            `, [userId, limit, offset]);
            
            // Organizar stories por usuário
            const storiesByUser = {};
            stories.rows.forEach(story => {
                if (!storiesByUser[story.user_id]) {
                    storiesByUser[story.user_id] = {
                        user: {
                            id: story.user_id,
                            nickname: story.nickname,
                            avatar_url: story.avatar_url
                        },
                        stories: [],
                        has_unviewed: false
                    };
                }
                
                storiesByUser[story.user_id].stories.push(story);
                if (!story.viewed_by_me) {
                    storiesByUser[story.user_id].has_unviewed = true;
                }
            });
            
            res.json({
                success: true,
                stories: Object.values(storiesByUser)
            });
            
        } catch (error) {
            logger.error('Error getting stories feed:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async viewStory(req, res) {
        try {
            const storyId = req.params.id;
            const viewerId = req.user.id;
            const { watch_duration = 0 } = req.body;
            
            // Inserir/atualizar visualização
            await db.query(`
                INSERT INTO story_views (story_id, viewer_id, watch_duration)
                VALUES ($1, $2, $3)
                ON CONFLICT (story_id, viewer_id)
                DO UPDATE SET 
                    viewed_at = NOW(),
                    watch_duration = GREATEST(story_views.watch_duration, $3)
            `, [storyId, viewerId, watch_duration]);
            
            // Atualizar contador na story
            await db.query(`
                UPDATE stories 
                SET views_count = (
                    SELECT COUNT(*) FROM story_views WHERE story_id = $1
                )
                WHERE id = $1
            `, [storyId]);
            
            // Notificar criador da story
            const story = await db.query(`
                SELECT user_id FROM stories WHERE id = $1
            `, [storyId]);
            
            if (story.rows[0] && story.rows[0].user_id !== viewerId) {
                io.to(`user_${story.rows[0].user_id}`).emit('story_viewed', {
                    story_id: storyId,
                    viewer: {
                        id: viewerId,
                        nickname: req.user.nickname
                    }
                });
            }
            
            res.json({ success: true });
            
        } catch (error) {
            logger.error('Error viewing story:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

module.exports = storiesController;
```

### **2. Frontend Architecture**

#### **2.1 Componentes React**

##### **StoriesContainer.tsx - Container Principal**
```typescript
// src/components/Stories/StoriesContainer.tsx
interface StoriesContainerProps {
  userId?: string; // Para visualizar stories de usuário específico
  className?: string;
}

interface StoryUser {
  user: {
    id: string;
    nickname: string;
    avatar_url: string;
  };
  stories: Story[];
  has_unviewed: boolean;
}

export const StoriesContainer: React.FC<StoriesContainerProps> = ({ 
  userId, 
  className 
}) => {
  const [storiesData, setStoriesData] = useState<StoryUser[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook customizado para gerenciar stories
  const { 
    stories, 
    isLoading: storiesLoading, 
    error: storiesError,
    refetch 
  } = useStories(userId);

  // Buscar stories feed
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const endpoint = userId 
          ? `/api/stories/user/${userId}` 
          : '/api/stories/feed';
          
        const response = await api.get(endpoint);
        setStoriesData(response.data.stories);
      } catch (err) {
        setError('Erro ao carregar stories');
        console.error('Stories fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [userId]);

  // WebSocket para stories em tempo real
  useEffect(() => {
    const socket = io('/stories');
    
    socket.on('new_story', (data) => {
      setStoriesData(prev => {
        const existingUserIndex = prev.findIndex(
          item => item.user.id === data.story.user_id
        );
        
        if (existingUserIndex >= 0) {
          // Adicionar story ao usuário existente
          const updated = [...prev];
          updated[existingUserIndex].stories.unshift(data.story);
          updated[existingUserIndex].has_unviewed = true;
          return updated;
        } else {
          // Novo usuário com story
          return [{
            user: data.user,
            stories: [data.story],
            has_unviewed: true
          }, ...prev];
        }
      });
    });
    
    socket.on('story_deleted', (storyId) => {
      setStoriesData(prev => 
        prev.map(userStories => ({
          ...userStories,
          stories: userStories.stories.filter(story => story.id !== storyId)
        })).filter(userStories => userStories.stories.length > 0)
      );
    });

    return () => socket.disconnect();
  }, []);

  const openStoryViewer = (userIndex: number, storyIndex: number = 0) => {
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(storyIndex);
  };

  const closeStoryViewer = () => {
    setCurrentUserIndex(null);
    setCurrentStoryIndex(0);
  };

  if (isLoading) {
    return <StoriesContainerSkeleton />;
  }

  if (error) {
    return <StoriesError message={error} onRetry={refetch} />;
  }

  return (
    <div className={cn("stories-container", className)}>
      {/* Stories Carousel */}
      <StoriesCarousel 
        storiesData={storiesData}
        onStoryClick={openStoryViewer}
        onCreateStory={() => setShowCreateModal(true)}
      />
      
      {/* Story Viewer Modal */}
      {currentUserIndex !== null && (
        <StoryViewer
          storiesData={storiesData}
          currentUserIndex={currentUserIndex}
          currentStoryIndex={currentStoryIndex}
          onClose={closeStoryViewer}
          onUserChange={setCurrentUserIndex}
          onStoryChange={setCurrentStoryIndex}
        />
      )}
      
      {/* Create Story Modal */}
      <CreateStoryModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newStory) => {
          // Adicionar story criado ao feed
          refetch();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};
```

##### **StoriesCarousel.tsx - Carousel Horizontal**
```typescript
// src/components/Stories/StoriesCarousel.tsx
interface StoriesCarouselProps {
  storiesData: StoryUser[];
  onStoryClick: (userIndex: number, storyIndex?: number) => void;
  onCreateStory: () => void;
}

export const StoriesCarousel: React.FC<StoriesCarouselProps> = ({
  storiesData,
  onStoryClick,
  onCreateStory
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Verificar se pode fazer scroll
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [storiesData]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = scrollContainerRef.current.scrollLeft + 
      (direction === 'right' ? scrollAmount : -scrollAmount);
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 
                     bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Stories Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2"
        onScroll={updateScrollButtons}
      >
        {/* Create Story Button */}
        <StoryBubble
          type="create"
          onClick={onCreateStory}
          className="flex-shrink-0"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <Plus className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs font-medium">Seu Story</span>
          </div>
        </StoryBubble>
        
        {/* User Stories */}
        {storiesData.map((userStories, userIndex) => (
          <StoryBubble
            key={userStories.user.id}
            type="user"
            user={userStories.user}
            hasUnviewed={userStories.has_unviewed}
            storyCount={userStories.stories.length}
            onClick={() => onStoryClick(userIndex)}
            className="flex-shrink-0"
          />
        ))}
      </div>
      
      {/* Scroll Right Button */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 
                     bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
```

##### **StoryViewer.tsx - Visualizador Full-Screen**
```typescript
// src/components/Stories/StoryViewer.tsx
interface StoryViewerProps {
  storiesData: StoryUser[];
  currentUserIndex: number;
  currentStoryIndex: number;
  onClose: () => void;
  onUserChange: (userIndex: number) => void;
  onStoryChange: (storyIndex: number) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  storiesData,
  currentUserIndex,
  currentStoryIndex,
  onClose,
  onUserChange,
  onStoryChange
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const currentUserStories = storiesData[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];
  
  if (!currentStory) return null;

  // Controlar progresso da story
  useEffect(() => {
    if (isPaused) return;
    
    const duration = currentStory.duration * 1000; // converter para ms
    const interval = 50; // atualizar a cada 50ms
    const increment = (interval / duration) * 100;
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, isPaused, currentUserIndex, currentStoryIndex]);

  // Marcar story como visualizada
  useEffect(() => {
    const markAsViewed = async () => {
      try {
        await api.post(`/api/stories/${currentStory.id}/view`, {
          watch_duration: Math.floor((progress / 100) * currentStory.duration)
        });
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    };

    if (progress > 10) { // Marcar como vista após 10% do progresso
      markAsViewed();
    }
  }, [currentStory.id, progress]);

  const nextStory = () => {
    const currentUserStoriesCount = currentUserStories.stories.length;
    
    if (currentStoryIndex < currentUserStoriesCount - 1) {
      // Próxima story do mesmo usuário
      onStoryChange(currentStoryIndex + 1);
      setProgress(0);
    } else if (currentUserIndex < storiesData.length - 1) {
      // Primeiro story do próximo usuário
      onUserChange(currentUserIndex + 1);
      onStoryChange(0);
      setProgress(0);
    } else {
      // Chegou ao fim, fechar viewer
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      // Story anterior do mesmo usuário
      onStoryChange(currentStoryIndex - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      // Última story do usuário anterior
      const prevUserIndex = currentUserIndex - 1;
      const prevUserStoriesCount = storiesData[prevUserIndex].stories.length;
      onUserChange(prevUserIndex);
      onStoryChange(prevUserStoriesCount - 1);
      setProgress(0);
    }
  };

  // Gestures para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    
    // Swipe horizontal (trocar usuário)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - usuário anterior
        if (currentUserIndex > 0) {
          onUserChange(currentUserIndex - 1);
          onStoryChange(0);
          setProgress(0);
        }
      } else {
        // Swipe left - próximo usuário
        if (currentUserIndex < storiesData.length - 1) {
          onUserChange(currentUserIndex + 1);
          onStoryChange(0);
          setProgress(0);
        }
      }
    }
    
    // Swipe vertical (fechar/responder)
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 100) {
      if (deltaY > 0) {
        // Swipe down - fechar
        onClose();
      } else {
        // Swipe up - responder
        setShowReplyInput(true);
      }
    }
    
    touchStartRef.current = null;
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickPosition = (x - rect.left) / rect.width;
    
    if (clickPosition < 0.3) {
      prevStory();
    } else if (clickPosition > 0.7) {
      nextStory();
    } else {
      setIsPaused(!isPaused);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Story Content */}
      <div 
        className="relative h-full w-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
          {currentUserStories.stories.map((_, index) => (
            <div 
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: index < currentStoryIndex 
                    ? '100%' 
                    : index === currentStoryIndex 
                      ? `${progress}%` 
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={currentUserStories.user.avatar_url} />
              <AvatarFallback>
                {currentUserStories.user.nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-white font-semibold text-sm">
                {currentUserStories.user.nickname}
              </span>
              <span className="text-white/70 text-xs ml-2">
                {formatTimeAgo(currentStory.created_at)}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {isPaused && (
              <Pause className="h-5 w-5 text-white" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Story Media */}
        <StoryContent story={currentStory} />

        {/* Story Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <p className="text-white text-sm bg-black/30 rounded-lg px-3 py-2">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Reply Button */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(true);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Responder
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              // Share story
            }}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reply Input Modal */}
      <StoryReplyModal
        isOpen={showReplyInput}
        onClose={() => setShowReplyInput(false)}
        story={currentStory}
        recipient={currentUserStories.user}
      />
    </div>
  );
};
```

#### **2.2 Hooks Customizados**

##### **useStories Hook**
```typescript
// src/hooks/useStories.tsx
export interface UseStoriesOptions {
  userId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useStories = (options: UseStoriesOptions = {}) => {
  const { userId, enabled = true, refetchInterval = 30000 } = options;
  
  return useQuery({
    queryKey: ['stories', userId],
    queryFn: async () => {
      const endpoint = userId ? `/api/stories/user/${userId}` : '/api/stories/feed';
      const response = await api.get(endpoint);
      return response.data.stories;
    },
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 segundos
    cacheTime: 300000, // 5 minutos
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storyData: CreateStoryData) => {
      const formData = new FormData();
      
      Object.entries(storyData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'media' && value instanceof File) {
            formData.append('media', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.post('/api/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data.story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stories']);
      toast.success('Story criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar story. Tente novamente.');
      console.error('Create story error:', error);
    }
  });
};

export const useViewStory = () => {
  return useMutation({
    mutationFn: async ({ storyId, watchDuration }: { 
      storyId: string; 
      watchDuration: number; 
    }) => {
      await api.post(`/api/stories/${storyId}/view`, { 
        watch_duration: watchDuration 
      });
    },
    onError: (error) => {
      console.error('View story error:', error);
    }
  });
};

export const useStoryReplies = (storyId: string) => {
  return useQuery({
    queryKey: ['story-replies', storyId],
    queryFn: async () => {
      const response = await api.get(`/api/stories/${storyId}/replies`);
      return response.data.replies;
    },
    enabled: !!storyId
  });
};
```

## 🎨 Design System e UX

### **1. Visual Design**

#### **1.1 Story Bubbles Design**
```css
/* Stories Carousel Styling */
.story-bubble {
  @apply relative w-16 h-16 rounded-full overflow-hidden cursor-pointer transition-transform;
}

.story-bubble:hover {
  @apply scale-105;
}

.story-bubble.has-unviewed {
  @apply ring-2 ring-blue-500 ring-offset-2 ring-offset-background;
}

.story-bubble.viewed {
  @apply ring-2 ring-gray-300 ring-offset-2 ring-offset-background;
}

.story-bubble-create {
  @apply bg-gradient-to-br from-blue-400 to-purple-500 text-white;
  @apply flex items-center justify-center;
}

.story-bubble-avatar {
  @apply w-full h-full object-cover;
}

.story-bubble-count {
  @apply absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs;
  @apply rounded-full w-5 h-5 flex items-center justify-center;
  @apply text-[10px] font-semibold;
}
```

#### **1.2 Story Viewer Interface**
```css
.story-viewer {
  @apply fixed inset-0 z-50 bg-black;
}

.story-progress-container {
  @apply absolute top-4 left-4 right-4 z-10 flex gap-1;
}

.story-progress-bar {
  @apply flex-1 h-1 bg-white/30 rounded-full overflow-hidden;
}

.story-progress-fill {
  @apply h-full bg-white transition-all duration-100 ease-linear;
}

.story-user-header {
  @apply absolute top-8 left-4 right-4 z-10 flex items-center justify-between;
}

.story-content-container {
  @apply relative h-full w-full flex items-center justify-center;
}

.story-caption {
  @apply absolute bottom-20 left-4 right-4 z-10;
  @apply text-white text-sm bg-black/30 rounded-lg px-3 py-2;
}

.story-actions {
  @apply absolute bottom-4 left-4 right-4 z-10 flex gap-2;
}
```

### **2. Responsive Design**

#### **2.1 Mobile First Approach**
```typescript
// src/components/Stories/ResponsiveStories.tsx
const useResponsiveStories = () => {
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  
  return {
    storyBubbleSize: isMobile ? 'h-14 w-14' : 'h-16 w-16',
    storiesPerView: isMobile ? 5 : isTablet ? 8 : 12,
    viewerPadding: isMobile ? 'p-2' : 'p-4',
    progressBarHeight: isMobile ? 'h-0.5' : 'h-1',
    captionPosition: isMobile ? 'bottom-16' : 'bottom-20',
  };
};
```

#### **2.2 Touch Gestures Support**
```typescript
// Touch gestures para navegação
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

const useStoryGestures = (onPrev: () => void, onNext: () => void, onClose: () => void) => {
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = touchEnd.time - touchStart.time;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;
    
    // Horizontal swipe (navegação entre usuários)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (velocityX > SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0) {
          onPrev(); // Swipe right
        } else {
          onNext(); // Swipe left
        }
      }
    }
    
    // Vertical swipe (fechar viewer)
    else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > SWIPE_THRESHOLD * 2) {
      if (velocityY > SWIPE_VELOCITY_THRESHOLD) {
        onClose(); // Swipe down
      }
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
```

## 🔧 Implementação Técnica Detalhada

### **1. Performance Optimizations**

#### **1.1 Image/Video Optimization**
```javascript
// src/utils/mediaOptimization.js
const STORY_IMAGE_SIZES = {
  thumbnail: { width: 64, height: 64, quality: 80 },
  preview: { width: 320, height: 568, quality: 85 },
  fullsize: { width: 720, height: 1280, quality: 90 }
};

export const optimizeStoryMedia = async (file, type = 'image') => {
  if (type === 'image') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const { width, height, quality } = STORY_IMAGE_SIZES.fullsize;
        
        // Calcular dimensões mantendo aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = width;
        let newHeight = height;
        
        if (aspectRatio > width / height) {
          newHeight = width / aspectRatio;
        } else {
          newWidth = height * aspectRatio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(resolve, 'image/jpeg', quality / 100);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  if (type === 'video') {
    // Implementar compressão de vídeo usando WebAssembly FFmpeg
    return await compressVideo(file, {
      maxDuration: 30, // 30 segundos máximo
      maxSize: 50 * 1024 * 1024, // 50MB máximo
      resolution: '720x1280',
      bitrate: '1M'
    });
  }
};

export const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.5; // Thumbnail no meio do vídeo
    });
    
    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    video.src = URL.createObjectURL(videoFile);
  });
};
```

#### **1.2 Lazy Loading e Caching**
```typescript
// src/hooks/useStoriesCache.tsx
interface StoriesCacheEntry {
  data: StoryUser[];
  timestamp: number;
  expiresAt: number;
}

class StoriesCache {
  private cache = new Map<string, StoriesCacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: StoryUser[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.TTL
    });
  }

  get(key: string): StoryUser[] | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}

export const storiesCache = new StoriesCache();

export const useStoriesWithCache = (userId?: string) => {
  const cacheKey = userId ? `user-${userId}` : 'feed';
  
  return useQuery({
    queryKey: ['stories', cacheKey],
    queryFn: async () => {
      // Verificar cache primeiro
      const cached = storiesCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Buscar do servidor
      const endpoint = userId ? `/api/stories/user/${userId}` : '/api/stories/feed';
      const response = await api.get(endpoint);
      const data = response.data.stories;
      
      // Salvar no cache
      storiesCache.set(cacheKey, data);
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};
```

### **2. WebSocket Real-time Updates**

#### **2.1 Socket Events Management**
```typescript
// src/services/socketService.ts
class StoriesSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Function[]>();

  connect() {
    this.socket = io('/stories', {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('Stories socket connected');
    });

    this.socket.on('new_story', (data) => {
      this.emit('new_story', data);
      // Invalidar cache
      storiesCache.invalidate();
    });

    this.socket.on('story_viewed', (data) => {
      this.emit('story_viewed', data);
    });

    this.socket.on('story_reply', (data) => {
      this.emit('story_reply', data);
    });

    this.socket.on('story_deleted', (storyId) => {
      this.emit('story_deleted', storyId);
      storiesCache.invalidate();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Notificar que usuário está visualizando stories
  joinStoriesRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('join_stories', { userId });
    }
  }

  // Notificar que parou de visualizar
  leaveStoriesRoom() {
    if (this.socket) {
      this.socket.emit('leave_stories');
    }
  }
}

export const storiesSocket = new StoriesSocketService();
```

### **3. Analytics e Tracking**

#### **3.1 Story Analytics Events**
```typescript
// src/services/storyAnalytics.ts
export interface StoryAnalyticsEvent {
  event: string;
  story_id?: string;
  user_id: string;
  properties: Record<string, any>;
  timestamp: Date;
}

class StoryAnalytics {
  private events: StoryAnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 segundos

  constructor() {
    // Enviar eventos em batch
    setInterval(() => this.flush(), this.flushInterval);
    
    // Enviar eventos antes de sair da página
    window.addEventListener('beforeunload', () => this.flush());
  }

  track(event: string, properties: Record<string, any> = {}) {
    this.events.push({
      event,
      story_id: properties.story_id,
      user_id: properties.user_id || getCurrentUserId(),
      properties,
      timestamp: new Date()
    });

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await api.post('/api/analytics/stories/batch', { events: eventsToSend });
    } catch (error) {
      console.error('Failed to send story analytics:', error);
      // Re-adicionar eventos em caso de erro
      this.events.unshift(...eventsToSend);
    }
  }
}

export const storyAnalytics = new StoryAnalytics();

// Eventos específicos
export const trackStoryEvents = {
  storyCreated: (storyId: string, type: string) => {
    storyAnalytics.track('story_created', {
      story_id: storyId,
      story_type: type
    });
  },

  storyViewed: (storyId: string, authorId: string, duration: number) => {
    storyAnalytics.track('story_viewed', {
      story_id: storyId,
      author_id: authorId,
      view_duration: duration
    });
  },

  storyShared: (storyId: string, method: string) => {
    storyAnalytics.track('story_shared', {
      story_id: storyId,
      share_method: method
    });
  },

  storyReplied: (storyId: string, replyType: string) => {
    storyAnalytics.track('story_replied', {
      story_id: storyId,
      reply_type: replyType
    });
  },

  storiesSessionStarted: () => {
    storyAnalytics.track('stories_session_started', {
      session_id: generateSessionId()
    });
  },

  storiesSessionEnded: (duration: number, storiesViewed: number) => {
    storyAnalytics.track('stories_session_ended', {
      session_duration: duration,
      stories_viewed: storiesViewed
    });
  }
};
```

## 🚀 Plano de Implementação

### **Sprint 1 (Semanas 1-2): Foundation**
- [ ] Setup da estrutura de dados (tabelas SQL)
- [ ] API endpoints básicos (CRUD stories)
- [ ] Componentes React base (StoriesContainer, StoryViewer)
- [ ] Upload de mídia básico
- [ ] WebSocket setup inicial

### **Sprint 2 (Semanas 3-4): Core Features**
- [ ] Sistema de visualizações
- [ ] Progress bars e navegação
- [ ] Touch gestures (mobile)
- [ ] Stories feed com cache
- [ ] Notificações real-time

### **Sprint 3 (Semanas 5-6): Advanced Features**
- [ ] Sistema de respostas/replies
- [ ] Analytics completo
- [ ] Performance optimizations
- [ ] Testes unitários e E2E
- [ ] Deployment e monitoramento

### **Sprint 4 (Semanas 7-8): Polish & Launch**
- [ ] UI/UX refinements
- [ ] Bug fixes e optimizations
- [ ] A/B testing setup
- [ ] Launch gradual (feature flag)
- [ ] Documentação e training

## 📊 Métricas de Sucesso

### **Métricas Técnicas**
- **Performance**: Tempo de carregamento < 2s
- **Disponibilidade**: 99.9% uptime
- **Error Rate**: < 0.1% de falhas
- **Cache Hit Rate**: > 80%

### **Métricas de Produto**
- **Adoption Rate**: 60% dos usuários ativos criaram ao menos 1 story
- **Engagement**: 3.5 stories visualizados por sessão
- **Retention**: +40% no D1 retention
- **Time Spent**: +60% no tempo médio de sessão

### **Métricas de Negócio**
- **DAU Growth**: +150% (2k → 5k)
- **Session Frequency**: +80% (usuários retornam 2x mais)
- **User Satisfaction**: NPS > 70
- **Viral Coefficient**: 1.2 (cada usuário convida 1.2 amigos)

---

**Responsável Técnico:** Equipe Frontend + Backend  
**Product Owner:** Product Manager  
**Timeline:** Q1 2025 (Sprints 1-4)  
**Prioridade:** Crítica

*Este sistema de Stories será o diferencial competitivo que transformará o Study Space de uma plataforma educacional básica em uma rede social viciante para estudantes.*