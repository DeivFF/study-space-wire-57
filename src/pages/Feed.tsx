import { useState, useEffect } from 'react';
import StudyPost from '../components/StudyFeed/StudyPost';
import '../components/StudyFeed/StudyFeedStyles.css';
import '../components/Feed/FeedStyles.css';
import { FeedHeader } from '../components/Feed/FeedHeader';
import { LeftSidebar } from '../components/Feed/LeftSidebar';
import { RightSidebar } from '../components/Feed/RightSidebar';
import { FriendsPanel } from '../components/Feed/FriendsPanel';
import { ChatDrawer } from '../components/Feed/ChatDrawer';

interface StudyPostData {
  id: string;
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

const samplePosts: StudyPostData[] = [
  {
    id: '1',
    author: {
      name: 'Maria Silva',
      avatar: 'M'
    },
    time: 'há 2 horas',
    category: 'Direito Constitucional',
    content: `Estudando os princípios fundamentais da Constituição Federal e encontrei este resumo útil sobre o Princípio da Dignidade da Pessoa Humana:

O art. 1º, III, da CF/88 estabelece a dignidade da pessoa humana como fundamento do Estado Democrático de Direito. Esse princípio serve como parâmetro para a interpretação de todo o ordenamento jurídico e deve orientar a atuação dos poderes públicos.

Algumas implicações práticas:
• Proibição de tratamentos desumanos ou degradantes
• Garantia de condições mínimas de existência digna
• Reconhecimento da autonomia e liberdade individual
• Valorização do desenvolvimento pleno da personalidade`,
    likes: 25,
    comments: [
      {
        id: '101',
        author: { name: 'João Santos', avatar: 'J' },
        text: 'Excelente resumo! Acrescentaria apenas que o princípio da dignidade também fundamenta direitos como a proteção à saúde e à educação.',
        time: 'há 1 hora',
        likes: 3,
        replies: [
          {
            id: '1011',
            author: { name: 'Maria Silva', avatar: 'M' },
            text: 'Verdade, João! Esses são desdobramentos importantes do princípio.',
            time: 'há 45 minutos',
            likes: 1
          }
        ]
      },
      {
        id: '102',
        author: { name: 'Ana Costa', avatar: 'A' },
        text: 'Alguém tem material complementar sobre a aplicação desse princípio no STF?',
        time: 'há 50 minutos',
        likes: 2,
        replies: []
      }
    ]
  },
  {
    id: '2',
    author: {
      name: 'Pedro Costa',
      avatar: 'P'
    },
    time: 'há 5 horas',
    category: 'Medicina',
    content: `Resolvendo questões de farmacologia e compartilho este mapa mental sobre classes de antibióticos que me ajudou muito:

Principais classes e seus mecanismos de ação:
• Beta-lactâmicos: Inibem a síntese da parede celular bacteriana
• Aminoglicosídeos: Inibem a síntese proteica bacteriana
• Macrolídeos: Ligam-se ao ribossomo 50S inibindo a translocação
• Quinolonas: Inibem a DNA girase e topoisomerase IV
• Tetracyclinas: Inibem a ligação do aminoacil-tRNA ao ribossomo

Alguém tem dicas para memorizar os espectros de ação?`,
    likes: 32,
    comments: [
      {
        id: '201',
        author: { name: 'Carla Mendes', avatar: 'C' },
        text: 'Para memorizar os espectros, sugiro associar cada classe a uma cor e criar um mapa mental visual!',
        time: 'há 3 horas',
        likes: 5,
        replies: []
      },
      {
        id: '202',
        author: { name: 'Ricardo Alves', avatar: 'R' },
        text: 'Recomendo o app "Antibiotic Guide" para estudar farmacologia. Me ajudou muito!',
        time: 'há 2 horas',
        likes: 4,
        replies: [
          {
            id: '2021',
            author: { name: 'Pedro Costa', avatar: 'P' },
            text: 'Obrigado pela dica, Ricardo! Vou testar.',
            time: 'há 1 hora',
            likes: 2
          }
        ]
      }
    ]
  }
];

export default function Feed() {
  const [posts, setPosts] = useState<StudyPostData[]>(samplePosts);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [friendsPanelOpen, setFriendsPanelOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(2);
  const [unreadMessagesCount] = useState(3);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    
    const newComment: CommentData = {
      id: Date.now().toString(),
      author: {
        name: 'Você',
        avatar: 'V'
      },
      text: commentText,
      time: 'Agora mesmo',
      likes: 0,
      replies: []
    };
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));
  };

  const handleReply = (postId: string, commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    
    const newReply: ReplyData = {
      id: Date.now().toString(),
      author: {
        name: 'Você',
        avatar: 'V'
      },
      text: replyText,
      time: 'Agora mesmo',
      likes: 0
    };
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <FeedHeader
        onToggleFriends={() => setFriendsPanelOpen(!friendsPanelOpen)}
        onToggleChat={() => setChatDrawerOpen(!chatDrawerOpen)}
        onToggleSidebar={handleToggleSidebar}
        friendRequestsCount={friendRequestsCount}
        unreadMessagesCount={unreadMessagesCount}
        isMobile={isMobile}
      />
      
      <div className="flex max-w-7xl mx-auto">
        <LeftSidebar 
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />
        
        <main className={`flex-1 min-w-0 px-4 py-6 ${!isMobile ? 'lg:max-w-2xl lg:mx-auto' : ''}`}>
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
        </main>
        
        {!isMobile && (
          <RightSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
          />
        )}
      </div>

      <FriendsPanel
        isOpen={friendsPanelOpen}
        onClose={() => setFriendsPanelOpen(false)}
        onRequestsUpdate={setFriendRequestsCount}
      />
      
      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </div>
  );
}