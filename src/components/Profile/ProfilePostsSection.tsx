import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';
import StudyPost from '@/components/StudyFeed/StudyPost';
import { useInfinitePosts } from '@/hooks/useInfinitePosts';
import { usePollVote } from '@/hooks/usePollVote';
import { useExerciseResponse } from '@/hooks/useExerciseResponse';

interface ProfilePostsSectionProps {
  userId: string;
  isMyProfile: boolean;
  initialLimit?: number;
}

const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({ 
  userId, 
  isMyProfile, 
  initialLimit = 10 
}) => {
  // Use the infinite posts hook with userId filter
  const { 
    posts, 
    loading, 
    loadingMore,
    error, 
    hasMore,
    likePost, 
    addComment, 
    refreshPosts,
    observerRef
  } = useInfinitePosts({ userId, limit: initialLimit });

  const { vote: pollVote } = usePollVote();
  const { submitResponse: exerciseResponse } = useExerciseResponse();

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    try {
      await addComment(postId, comment);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReply = async (postId: string, commentId: string, reply: string) => {
    // For now, treat replies as regular comments
    // This can be enhanced later with proper reply functionality
    try {
      await addComment(postId, `@${commentId} ${reply}`);
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const PostsSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-4 mt-4">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const LoadingMoreIndicator = () => (
    <div className="flex justify-center items-center py-6">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Carregando mais posts...</span>
    </div>
  );

  if (loading) return <PostsSkeleton />;

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-red-600 text-sm mb-2">Erro ao carregar publicações</div>
        <p className="text-muted-foreground text-xs">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => refreshPosts()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium mb-1">
          {isMyProfile ? 'Você ainda não fez nenhuma publicação' : 'Este usuário ainda não fez publicações'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isMyProfile ? 'Comece compartilhando conhecimento!' : 'Volte mais tarde para ver as novidades'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts with infinite scroll */}
      <div className="space-y-6">
        {posts.map((post) => (
          <StudyPost
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onReply={handleReply}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loadingMore && <LoadingMoreIndicator />}

      {/* Intersection observer target */}
      {hasMore && !loading && (
        <div 
          ref={observerRef} 
          className="h-10 flex items-center justify-center"
        >
          <div className="text-xs text-muted-foreground">
            Role para carregar mais posts...
          </div>
        </div>
      )}

      {/* End of posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6">
          <div className="text-sm text-muted-foreground">
            {isMyProfile ? 'Você chegou ao fim das suas publicações!' : 'Você chegou ao fim das publicações deste usuário!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePostsSection;