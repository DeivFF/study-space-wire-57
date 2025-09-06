import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Author {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  type: 'publicacao' | 'duvida' | 'exercicio' | 'desafio' | 'enquete';
  data: any;
  tags: string[];
  isAnonymous: boolean;
  category?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  comments?: Comment[];
}

interface UsePostsOptions {
  userId?: string; // Para filtrar posts de um usuário específico
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  loadPosts: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export const usePosts = (options: UsePostsOptions = {}): UsePostsReturn => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      // Determine the endpoint based on options
      const endpoint = options.userId 
        ? `http://localhost:3002/api/profile/${options.userId}/posts`
        : 'http://localhost:3002/api/posts/feed';

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
      const transformedPosts = postsArray.map((post: any) => ({
        ...post,
        time: new Date(post.createdAt).toLocaleString('pt-BR'),
        // Normalize fields for StudyPost component
        likes: post.likesCount || 0,
        comments: (post.comments || []).map((comment: any) => ({
          id: comment.id,
          author: {
            name: comment.author?.name || 'Usuário Anônimo',
            avatar: comment.author?.avatarUrl || comment.author?.nickname?.charAt(0) || '?',
          },
          text: comment.content || comment.text || '',
          time: new Date(comment.createdAt || Date.now()).toLocaleString('pt-BR'),
          likes: comment.likesCount || 0,
          replies: comment.replies || [],
        })),
        isLiked: post.isLiked || false,
        author: {
          name: post.author?.name || 'Usuário Anônimo',
          avatar: post.author?.avatarUrl || post.author?.nickname?.charAt(0) || '?',
        },
        // Ensure all required fields are present
        category: post.category || '',
        title: post.title || '',
        content: post.content || '',
        tags: post.tags || [],
        data: post.data || {},
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user, options.userId]);

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
    await loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, loadPosts]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    likePost,
    addComment,
    updateComment,
    deleteComment,
    refreshPosts,
  };
};