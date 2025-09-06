import { useState } from 'react';
import { 
  BookOpen, 
  ThumbsUp, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  CornerDownLeft,
  Bold,
  Italic,
  Code,
  Link,
  X,
  PenLine,
  HelpCircle,
  BarChart2,
  PencilRuler
} from 'lucide-react';
import './StudyPost.css';
import { PublicacaoPost, DuvidaPost, EnquetePost, ExercicioPost } from './PostTypes';

interface StudyPost {
  id: string;
  title?: string;
  type: 'publicacao' | 'duvida' | 'exercicio' | 'desafio' | 'enquete';
  data: Record<string, unknown>;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  time: string;
  category: string;
  content: string;
  likes: number;
  comments: Comment[];
  isLiked?: boolean;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
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

interface StudyPostProps {
  post: StudyPost;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onReply: (postId: string, commentId: string, reply: string) => void;
}

export default function StudyPost({ post, onLike, onComment, onReply }: StudyPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike(post.id);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleReply = (commentId: string) => {
    if (replyText.trim()) {
      onReply(post.id, commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'publicacao':
        return <PenLine size={20} />;
      case 'duvida':
        return <HelpCircle size={20} />;
      case 'enquete':
        return <BarChart2 size={20} />;
      case 'exercicio':
        return <PencilRuler size={20} />;
      default:
        return <BookOpen size={20} />;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'publicacao':
        return 'Publicação';
      case 'duvida':
        return 'Dúvida';
      case 'enquete':
        return 'Enquete';
      case 'exercicio':
        return 'Exercício';
      default:
        return 'Publicação';
    }
  };


  const renderPostContent = () => {
    switch (post.type) {
      case 'duvida':
        return (
          <DuvidaPost
            title={post.title}
            content={post.content}
            tags={post.tags}
          />
        );
      
      case 'enquete':
        return (
          <EnquetePost
            title={post.title}
            options={(post.data?.poll_options as string[]) || []}
            duration={(post.data?.poll_duration as string) || ''}
            postId={post.id}
          />
        );
      
      case 'exercicio':
        return (
          <ExercicioPost
            content={post.content}
            options={(post.data?.alternativas || post.data?.options) as string[] || []}
            difficulty={(post.data?.nivel_dificuldade || post.data?.difficulty) as string || ''}
            subject={(post.data?.categoria_materia || post.data?.subject) as string || ''}
            postId={post.id}
          />
        );
      
      default:
        return (
          <PublicacaoPost content={post.content} />
        );
    }
  };

  return (
    <div className="study-post-card">
      {/* Header */}
      <div className="study-post-header">
        {getPostIcon()}
      </div>
      
      {/* Content */}
      <div className="study-post-content">
        {/* Author Info */}
        <div className="study-author-section">
          <div className="study-avatar">{post.author.avatar}</div>
          <div className="study-author-meta">
            <div className="study-author-name">
              {post.author.name} <span className="chip">{getPostTypeLabel()}</span>
            </div>
            <div className="study-post-time">{post.time}</div>
          </div>
          <button className="study-more-btn">
            <MoreHorizontal size={16} />
          </button>
        </div>
        
        {/* Post Content */}
        {renderPostContent()}
        
        {/* Interaction Bar */}
        <div className="study-interaction-bar">
          <button 
            className={`study-interaction-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <ThumbsUp size={16} />
            <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
          </button>
          <button 
            className="study-interaction-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={16} />
            <span>Comentar</span>
          </button>
          <button className="study-interaction-btn">
            <Share size={16} />
            <span>Compartilhar</span>
          </button>
        </div>
        
        {/* Counters */}
        <div className="study-counters">
          <span>{likeCount} curtidas</span>
          <span>{post.comments.length} comentários</span>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div className="study-comments-section">
            {/* Comments List */}
            <div className="study-comments-list">
              {post.comments.length === 0 ? (
                <div className="text-center py-5 text-muted-foreground text-sm">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </div>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment.id} className="study-comment">
                    <div className="study-comment-avatar">{comment.author.avatar}</div>
                    <div className="study-comment-content">
                      <div className="study-comment-author">{comment.author.name}</div>
                      <div className="study-comment-text">{comment.text}</div>
                      <div className="study-comment-actions">
                        <button className="study-comment-action-btn">
                          <ThumbsUp size={12} />
                          <span>{comment.likes}</span>
                        </button>
                        <button 
                          className="study-comment-action-btn"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          <CornerDownLeft size={12} />
                          Responder
                        </button>
                        <div className="text-xs text-muted-foreground">{comment.time}</div>
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="study-replies">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="study-comment">
                              <div className="study-comment-avatar">{reply.author.avatar}</div>
                              <div className="study-comment-content">
                                <div className="study-comment-author">{reply.author.name}</div>
                                <div className="study-comment-text">{reply.text}</div>
                                <div className="study-comment-actions">
                                  <button className="study-comment-action-btn">
                                    <ThumbsUp size={12} />
                                    <span>{reply.likes}</span>
                                  </button>
                                  <div className="text-xs text-muted-foreground">{reply.time}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="study-comment-form mt-3">
                          <div className="study-replying-to">
                            <div className="study-replying-to-text">
                              Respondendo a <span className="font-semibold">{comment.author.name}</span>
                            </div>
                            <button 
                              className="study-replying-to-cancel"
                              onClick={() => setReplyingTo(null)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <textarea
                            className="study-comment-textarea"
                            placeholder="Adicione uma resposta..."
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="study-comment-form-actions">
                            <div className="study-format-buttons">
                              <button className="study-format-btn" title="Negrito">
                                <Bold size={14} />
                              </button>
                              <button className="study-format-btn" title="Itálico">
                                <Italic size={14} />
                              </button>
                              <button className="study-format-btn" title="Código">
                                <Code size={14} />
                              </button>
                              <button className="study-format-btn" title="Link">
                                <Link size={14} />
                              </button>
                            </div>
                            <button 
                              className="study-comment-submit-btn"
                              onClick={() => handleReply(comment.id)}
                            >
                              Responder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Comment Form */}
            <div className="study-comment-form">
              <textarea
                className="study-comment-textarea"
                placeholder="Adicione um comentário..."
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="study-comment-form-actions">
                <div className="study-format-buttons">
                  <button className="study-format-btn" title="Negrito">
                    <Bold size={14} />
                  </button>
                  <button className="study-format-btn" title="Itálico">
                    <Italic size={14} />
                  </button>
                  <button className="study-format-btn" title="Código">
                    <Code size={14} />
                  </button>
                  <button className="study-format-btn" title="Link">
                    <Link size={14} />
                  </button>
                </div>
                <button 
                  className="study-comment-submit-btn"
                  onClick={handleComment}
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}