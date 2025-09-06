import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Author {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  // Required by StudyPost component
  avatar: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  // Additional properties required by StudyPost component
  text: string;
  time: string;
  likes: number;
  replies?: Reply[];
}

interface Reply {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  time: string;
  likes: number;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  type: 'publicacao' | 'duvida' | 'exercicio' | 'desafio' | 'enquete';
  data: any;
  tags: string[];
  isAnonymous: boolean;
  category: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  comments: Comment[];
  // Additional properties required by StudyPost component
  time: string;
  likes: number;
}

interface UseInfinitePostsOptions {
  userId?: string;
  limit?: number;
}

interface UseInfinitePostsReturn {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  observerRef: React.RefObject<HTMLDivElement>;
}

export const useInfinitePosts = (options: UseInfinitePostsOptions = {}): UseInfinitePostsReturn => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const limit = options.limit || 10;
  const observerRef = useRef<HTMLDivElement>(null);

  const transformPost = (post: any): Post => ({
    ...post,
    time: new Date(post.createdAt).toLocaleString('pt-BR'),
    // Normalize fields for StudyPost component
    likes: post.likesCount || 0,
    comments: (post.comments || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content || comment.text || '',
      createdAt: comment.createdAt || new Date().toISOString(),
      updatedAt: comment.updatedAt || new Date().toISOString(),
      author: {
        id: comment.author?.id || '',
        name: comment.author?.name || 'Usuário Anônimo',
        nickname: comment.author?.nickname,
        avatarUrl: comment.author?.avatarUrl,
        avatar: comment.author?.avatarUrl || comment.author?.nickname?.charAt(0) || comment.author?.name?.charAt(0) || '?',
      },
      text: comment.content || comment.text || '',
      time: new Date(comment.createdAt || Date.now()).toLocaleString('pt-BR'),
      likes: comment.likesCount || 0,
      replies: comment.replies || [],
    })),
    isLiked: post.isLiked || false,
    author: {
      id: post.author?.id || '',
      name: post.author?.name || 'Usuário Anônimo',
      nickname: post.author?.nickname,
      avatarUrl: post.author?.avatarUrl,
      avatar: post.author?.avatarUrl || post.author?.nickname?.charAt(0) || post.author?.name?.charAt(0) || '?',
    },
    // Ensure all required fields are present
    category: post.category || '',
    title: post.title || '',
    content: post.content || '',
    tags: post.tags || [],
    data: post.data || {},
  });

  const loadPosts = useCallback(async (isLoadMore: boolean = false) => {
    if (!user) return;

    try {
      if (!isLoadMore) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const currentOffset = isLoadMore ? offset : 0;
      
      // Determine the endpoint based on options
      const endpoint = options.userId 
        ? `http://localhost:3002/api/profile/${options.userId}/posts?limit=${limit}&offset=${currentOffset}`
        : `http://localhost:3002/api/posts/feed?limit=${limit}&offset=${currentOffset}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar posts');
      }

      const data = await response.json();
      
      // Transform API response to match frontend format
      const postsArray = options.userId ? data.data.posts : data.data.posts;
      const transformedPosts = postsArray.map(transformPost);

      if (isLoadMore) {
        setPosts(prevPosts => [...prevPosts, ...transformedPosts]);
        setOffset(currentOffset + transformedPosts.length);
      } else {
        setPosts(transformedPosts);
        setOffset(transformedPosts.length);
      }

      // Update hasMore based on API response
      if (options.userId) {
        setHasMore(data.data.hasMore || false);
      } else {
        // For feed, we assume there's more unless we get less than limit
        setHasMore(transformedPosts.length === limit);
      }

    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, options.userId, limit, offset]);

  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await loadPosts(true);
    }
  }, [loadPosts, loadingMore, hasMore]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch(`http://localhost:3002/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao curtir post');
      }

      const result = await response.json();
      
      // Update post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: result.data.action === 'liked',
                likesCount: result.data.likesCount 
              }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [user]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch(`http://localhost:3002/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar comentário');
      }

      const result = await response.json();
      
      // Update post with new comment
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                commentsCount: post.commentsCount + 1,
                comments: [...(post.comments || []), result.data]
              }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [user]);

  const updateComment = useCallback(async (postId: string, commentId: string, content: string) => {
    if (!user) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch(`http://localhost:3002/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar comentário');
      }

      const result = await response.json();
      
      // Update comment in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comments: post.comments?.map(comment => 
                  comment.id === commentId ? result.data : comment
                )
              }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [user]);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    if (!user) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch(`http://localhost:3002/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao deletar comentário');
      }
      
      // Remove comment from local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                commentsCount: Math.max(post.commentsCount - 1, 0),
                comments: post.comments?.filter(comment => comment.id !== commentId)
              }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [user]);

  const refreshPosts = useCallback(async () => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    await loadPosts(false);
  }, [loadPosts]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  useEffect(() => {
    if (user) {
      loadPosts(false);
    }
  }, [user, options.userId]);

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    likePost,
    addComment,
    updateComment,
    deleteComment,
    refreshPosts,
    observerRef,
  };
};