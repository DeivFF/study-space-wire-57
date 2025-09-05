import { useState, useEffect } from 'react';
import StudyPost from '../components/StudyFeed/StudyPost';
import '../components/StudyFeed/StudyFeedStyles.css';
import '../components/Feed/FeedStyles.css';
import { LeftSidebar } from '../components/Feed/LeftSidebar';
import { RightSidebar } from '../components/Feed/RightSidebar';
import { FriendsPanel } from '../components/Feed/FriendsPanel';
import { PostComposerV2 } from '../components/Post/PostComposerV2';
import { usePosts } from '../hooks/usePosts';

interface StudyPostData {
  id: string;
  title?: string;
  type: 'publicacao' | 'duvida' | 'exercicio' | 'desafio' | 'enquete';
  data: any;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  time: string;
  category: string;
  content: string;
  likes: number;
  comments: CommentData[];
  isLiked?: boolean;
}

interface CommentData {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  time: string;
  likes: number;
  replies?: ReplyData[];
}

interface ReplyData {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  time: string;
  likes: number;
}


export default function Feed() {
  const { posts, loading, error, likePost, addComment, refreshPosts } = usePosts();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [friendsPanelOpen, setFriendsPanelOpen] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftSidebarOpen(!leftSidebarOpen);
    } else {
      setRightSidebarOpen(!rightSidebarOpen);
    }
  };

  const handleClosePanels = () => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
    setFriendsPanelOpen(false);
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    
    try {
      await addComment(postId, commentText);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleReply = (postId: string, commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    
    // For now, just log the reply as this would need API integration
    console.log('Reply to post:', postId, 'comment:', commentId, 'text:', replyText);
  };

  const handleAddFriend = async (userId: string) => {
    try {
      // In a real implementation, this would call your API
      console.log('Adding friend:', userId);
      
      // Simulate API call
      // const response = await fetch('/api/connections', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      //   },
      //   body: JSON.stringify({ receiverId: userId })
      // });
      
      // if (response.ok) {
      //   // Update UI to reflect the new connection request
      //   setSearchResults(prev => prev.filter(user => user.id !== userId));
      // }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg pt-16">
      
      <div className="flex max-w-7xl mx-auto">
        <LeftSidebar 
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />
        
        <main className={`flex-1 min-w-0 px-4 py-6 ${!isMobile ? 'lg:max-w-2xl lg:mx-auto' : ''}`}>
          <div className="space-y-6">
            <PostComposerV2 
              onPostCreated={(newPost) => {
                console.log('Novo post criado:', newPost);
                // Refresh posts to show the new one
                refreshPosts();
              }}
              className="mb-6"
              initiallyOpen={true}
            />

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Carregando posts...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">Erro: {error}</p>
                <button 
                  onClick={refreshPosts}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">Nenhum post encontrado</p>
                <p className="text-sm text-gray-500">
                  Seja o primeiro a compartilhar algo interessante!
                </p>
              </div>
            )}
            
            {posts.map((post) => {
              // Transform API post to StudyPostData format
              const studyPost: StudyPostData = {
                id: post.id,
                title: post.title,
                type: post.type || 'publicacao',
                data: post.data || {},
                tags: post.tags || [],
                author: {
                  name: post.author.name,
                  avatar: post.author.name.charAt(0).toUpperCase()
                },
                time: new Date(post.createdAt).toLocaleString('pt-BR'),
                category: post.tags.join(', ') || post.type,
                content: post.content,
                likes: post.likesCount,
                isLiked: post.isLiked,
                comments: (post.comments || []).map(comment => ({
                  id: comment.id,
                  author: {
                    name: comment.author.name,
                    avatar: comment.author.name.charAt(0).toUpperCase()
                  },
                  text: comment.content,
                  time: new Date(comment.createdAt).toLocaleString('pt-BR'),
                  likes: 0,
                  replies: []
                }))
              };

              return (
                <StudyPost
                  key={post.id}
                  post={studyPost}
                  onLike={handleLike}
                  onComment={handleComment}
                  onReply={handleReply}
                />
              );
            })}
          </div>
        </main>
        
        {!isMobile && (
          <RightSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
          />
        )}
      </div>

    </div>
  );
}