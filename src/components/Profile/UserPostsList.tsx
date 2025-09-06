import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Heart, Clock } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  data: any;
  type: 'text' | 'enquete' | 'exercicio';
  createdAt: string;
  author: {
    id: string;
    name: string;
    nickname: string;
    avatarUrl: string;
  };
  stats: {
    likes: number;
    comments: number;
    isLikedByCurrentUser: boolean;
  };
}

interface UserPostsListProps {
  userId: string;
  limit?: number;
}

const PostPreview: React.FC<{ post: Post }> = ({ post }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'enquete': return 'bg-blue-100 text-blue-800';
      case 'exercicio': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'enquete': return 'Enquete';
      case 'exercicio': return 'Exercício';
      default: return 'Texto';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getPostTypeColor(post.type)}`}
          >
            {getPostTypeLabel(post.type)}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(post.createdAt)}
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-3">
          {truncateContent(post.content)}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className={`h-3 w-3 ${post.stats.isLikedByCurrentUser ? 'text-red-500 fill-current' : ''}`} />
              {post.stats.likes}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.stats.comments}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PostsSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 bg-gray-200 rounded w-8" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const UserPostsList: React.FC<UserPostsListProps> = ({ userId, limit = 5 }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`http://localhost:3002/api/profile/${userId}/posts?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Você não tem permissão para ver as publicações deste usuário');
        }
        if (response.status === 404) {
          throw new Error('Usuário não encontrado');
        }
        throw new Error('Erro ao carregar publicações');
      }
      
      const data = await response.json();
      setPosts(data.data.posts || []);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PostsSkeleton />;
  
  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nenhuma publicação ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <PostPreview key={post.id} post={post} />
      ))}
      {posts.length >= limit && (
        <Button variant="outline" size="sm" className="w-full mt-3">
          Ver todas as publicações
        </Button>
      )}
    </div>
  );
};

export default UserPostsList;