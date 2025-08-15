'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { formatRelativeTime } from '@/lib/utils';
import { Comment } from '@/types';
import { getComments, addComment, likeComment, unlikeComment, isCommentLikedByUser, deleteComment } from '@/lib/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button, Input, Card } from '@mond-design-system/theme';
import { BotCheck } from './BotCheck';
import { ReportModal } from './ReportModal';

interface CommentsSectionProps {
  poemId: string;
  poemTitle: string;
  initialCommentCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function CommentsSection({ poemId, poemTitle, initialCommentCount = 0, isExpanded: externalIsExpanded, onToggle }: CommentsSectionProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser } = useAuth();
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external control if provided, otherwise internal state
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

  // Count only non-deleted comments and replies
  const activeComments = comments.filter(c => !c.isDeleted).length;
  const activeReplies = replies.filter(r => !r.isDeleted).length;
  const commentCount = (activeComments + activeReplies) || (comments.length + replies.length > 0 ? activeComments + activeReplies : initialCommentCount);

  const handleToggle = async () => {
    if (onToggle) {
      // Use external toggle handler
      onToggle();
    } else {
      // Use internal toggle
      setInternalIsExpanded(!internalIsExpanded);
    }
    
    // Load comments when expanding for the first time
    if (!isExpanded && comments.length === 0) {
      setLoading(true);
      setError(null);
      try {
        const fetchedComments = await getComments(poemId);
        // Separate top-level comments and replies
        const topLevel = fetchedComments.filter(c => !c.parentId);
        const allReplies = fetchedComments.filter(c => c.parentId);
        setComments(topLevel);
        setReplies(allReplies);
      } catch (err) {
        console.error('Error loading comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    if (newComment.parentId) {
      // This is a reply
      setReplies(prev => [...prev, newComment]);
    } else {
      // This is a top-level comment
      setComments(prev => [...prev, newComment]);
    }
  };

  const handleReplyAdded = (reply: Comment) => {
    setReplies(prev => [...prev, reply]);
  };

  const handleCommentDeleted = (commentId: string) => {
    // Mark the comment as deleted in both comments and replies lists
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, isDeleted: true } : c
    ));
    setReplies(prev => prev.map(r => 
      r.id === commentId ? { ...r, isDeleted: true } : r
    ));
  };

  // Get replies for a specific comment
  const getRepliesForComment = (commentId: string) => {
    return replies.filter(reply => reply.parentId === commentId);
  };

  // Render nested replies recursively
  const renderReplies = (parentId: string, depth: number = 1) => {
    const parentReplies = getRepliesForComment(parentId);
    
    return parentReplies.map((reply) => (
      <div key={reply.id} className={`ml-8 space-y-3`}>
        <CommentItem 
          comment={reply} 
          poemTitle={poemTitle}
          onReplyAdded={handleReplyAdded}
          onCommentDeleted={handleCommentDeleted}
        />
        
        {/* Recursively render replies to this reply */}
        {renderReplies(reply.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className={`border-t ${themeClasses.border} pt-4 px-3`} id="comments">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:${themeClasses.muted} ${themeClasses.foreground}`}
      >
        {/* Comment Icon */}
        <span className="text-xl">💬</span>
        
        {/* Comment Count */}
        <span className="font-medium">
          {commentCount === 0 ? 'No comments yet' : 
           commentCount === 1 ? '1 comment' : 
           `${commentCount} comments`}
        </span>
        
        {/* Chevron Icon */}
        <div className="ml-auto">
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>
      </button>

      {/* Expandable Comments Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Loading State */}
          {loading && (
            <div className={`text-center py-8 ${themeClasses.mutedForeground}`}>
              <div className="animate-pulse">Loading comments...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {/* Comments Content */}
          {!loading && !error && (
            <>
              {/* Comments List */}
              {comments.length === 0 ? (
                <div className={`text-center py-8 ${themeClasses.mutedForeground}`}>
                  <div className="text-4xl mb-2">💬</div>
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      <CommentItem 
                        comment={comment} 
                        poemTitle={poemTitle}
                        onReplyAdded={handleReplyAdded}
                        onCommentDeleted={handleCommentDeleted}
                      />
                      
                      {/* Render all nested replies recursively */}
                      {renderReplies(comment.id)}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <div className={`border-t ${themeClasses.border} pt-4 mt-6`}>
                <CommentForm 
                  poemId={poemId} 
                  poemTitle={poemTitle} 
                  onCommentAdded={handleCommentAdded}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  poemTitle: string;
  onReplyAdded: (reply: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

function CommentItem({ comment, poemTitle, onReplyAdded, onCommentDeleted }: CommentItemProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [loadingLikeStatus, setLoadingLikeStatus] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const checkLikeStatus = async () => {
      setLoadingLikeStatus(true);
      try {
        const liked = await isCommentLikedByUser(comment.id, currentUser?.id || null, currentUser ? null : sessionId);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking comment like status:', error);
        setIsLiked(false);
      } finally {
        setLoadingLikeStatus(false);
      }
    };
    
    checkLikeStatus();
  }, [comment.id, currentUser?.id, sessionId, currentUser]);

  useEffect(() => {
    // Load actual like count from database
    const loadLikeCount = async () => {
      try {
        const q = query(
          collection(db, 'commentLikes'),
          where('commentId', '==', comment.id)
        );
        const snapshot = await getDocs(q);
        setLikeCount(snapshot.size);
      } catch (error) {
        console.error('Error loading like count:', error);
        setLikeCount(comment.likeCount || 0);
      }
    };
    
    loadLikeCount();
  }, [comment.id, comment.likeCount]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    const newLikedState = !wasLiked;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      if (newLikedState) {
        await likeComment(comment.id, currentUser?.id || null, currentUser ? null : sessionId);
      } else {
        await unlikeComment(comment.id, currentUser?.id || null, currentUser ? null : sessionId);
      }
    } catch (err) {
      console.error('Error updating comment like:', err);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser?.isAdmin || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteComment(comment.id, currentUser.id);
      setShowDeleteConfirm(false);
      // Notify parent component that comment was deleted
      onCommentDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = currentUser?.isAdmin;

  const handleReplyAdded = (reply: Comment) => {
    setShowReplyForm(false);
    onReplyAdded(reply);
  };
  
  return (
    <Card 
      isDarkMode={theme === 'dark'}
      style={{ marginLeft: `${comment.depth * 24}px` }}
    >
      <Card.Header>
        {comment.isDeleted ? (
          <div className={`text-sm italic ${themeClasses.mutedForeground} py-2`}>
            Comment has been deleted
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-8 h-8 ${themeClasses.muted} rounded-full flex items-center justify-center`}>
                <span className={`text-xs font-semibold ${themeClasses.foreground}`}>
                  {comment.authorName[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              
              {/* Author info */}
              <div>
                <p className={`text-sm font-medium ${themeClasses.foreground}`}>
                  {comment.authorName}
                  {comment.authorId && <span className={`ml-2 text-xs ${themeClasses.mutedForeground}`}>• User</span>}
                </p>
                <p className={`text-xs ${themeClasses.mutedForeground}`}>
                  {formatRelativeTime(comment.createdAt)}
                  {comment.isReported && (
                    <span className="ml-2 text-xs text-orange-500">• Reported</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card.Header>
      
      {!comment.isDeleted && (
        <>
          <Card.Content>
            {/* Comment content */}
            <div className="prose prose-sm max-w-none">
              <div 
                className={`${themeClasses.foreground} whitespace-pre-wrap leading-relaxed`}
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>
          </Card.Content>

          <Card.Footer>
            {/* Comment actions */}
            <div className="flex items-center gap-4">
              {/* Like Button */}
              <button 
                onClick={handleLike}
                disabled={isLiking || loadingLikeStatus}
                className={`text-sm flex items-center gap-1 transition-colors ${
                  isLiked 
                    ? `${themeClasses.foreground} hover:${themeClasses.foreground}/80` 
                    : `${themeClasses.mutedForeground} hover:${themeClasses.foreground}`
                }`}
              >
                {loadingLikeStatus ? (
                  <span className="text-lg animate-pulse">🤍</span>
                ) : (
                  <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                )}
                <span>{likeCount}</span>
              </button>
              
              {/* Reply Button */}
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className={`text-sm ${themeClasses.mutedForeground} hover:${themeClasses.foreground}`}
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
              
              {/* Report Button */}
              <button 
                onClick={() => setShowReportModal(true)}
                className={`text-sm ${themeClasses.mutedForeground} hover:text-red-500`}
              >
                Report
              </button>

              {/* Admin Delete Button */}
              {isAdmin && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className={`text-sm ${themeClasses.mutedForeground} hover:text-red-600`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </Card.Footer>
        </>
      )}

      {/* Inline Reply Form */}
      {showReplyForm && !comment.isDeleted && (
        <div className={`mt-4 pl-6 border-l-2 ${themeClasses.border}`}>
                  <CommentForm 
          poemId={comment.poemId}
          poemTitle={poemTitle}
          parentId={comment.id}
          parentComment={comment}
          onCommentAdded={handleReplyAdded}
        />
      </div>
    )}

    {/* Report Modal */}
    <ReportModal
      comment={comment}
      isOpen={showReportModal}
      onClose={() => setShowReportModal(false)}
      onReported={() => {
        // Optional: Update UI to show the comment has been reported
        console.log('Comment reported successfully');
      }}
    />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card isDarkMode={theme === 'dark'} className="max-w-md w-full">
            <Card.Header>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h3 className={`text-lg font-semibold ${themeClasses.foreground}`}>
                  Delete Comment
                </h3>
              </div>
            </Card.Header>
            
            <Card.Content>
              
              <p className={`${themeClasses.foreground} mb-6`}>
                Are you sure you want to delete this comment by {comment.authorName}? This action cannot be undone.
              </p>
              
              <div className={`mb-4 p-3 ${themeClasses.muted} rounded border ${themeClasses.border} text-sm`}>
                {comment.content.length > 100 ? 
                  `${comment.content.substring(0, 100)}...` : 
                  comment.content
                }
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  isDarkMode={theme === 'dark'}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isDarkMode={theme === 'dark'}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Comment'}
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </Card>
  );
}

interface CommentFormProps {
  poemId: string;
  poemTitle: string;
  parentId?: string;
  parentComment?: Comment;
  onCommentAdded: (comment: Comment) => void;
}

function CommentForm({ poemId, poemTitle, parentId, parentComment, onCommentAdded }: CommentFormProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBotCheck, setShowBotCheck] = useState(false);
  const [botCheckPassed, setBotCheckPassed] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const isAnonymous = !currentUser;

  

  const submitComment = async (forceBotCheckPassed = false) => {
    setIsSubmitting(true);

    try {
      // Use provided name or fallback to "Anonymous"
      const displayName = authorName.trim() || 'Anonymous';
      
      // Calculate proper depth and threadPath
      let depth = 0;
      let threadPath = '';
      
      if (parentId && parentComment) {
        depth = parentComment.depth + 1;
        threadPath = parentComment.threadPath ? `${parentComment.threadPath}/${parentId}` : parentId;
      } else if (parentId) {
        // Fallback if parentComment is not provided
        depth = 1;
        threadPath = parentId;
      }
      
      const commentData = {
        poemId,
        authorId: currentUser?.id || null,
        authorName: displayName,
        authorEmail: currentUser?.email || authorEmail.trim() || null,
        content: content.trim(),
        parentId: parentId || null,
        threadPath,
        depth,
        likeCount: 0,
        replyCount: 0,
        isReported: false,
        reportCount: 0,
        isDeleted: false,
        sessionId: isAnonymous ? sessionId : '',
        ipAddress: null,
        botCheckPassed: isAnonymous ? (forceBotCheckPassed || botCheckPassed) : false,
      };

      const commentId = await addComment(commentData);
      
      const newComment: Comment = {
        id: commentId,
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onCommentAdded(newComment);

      // Reset form
      setContent('');
      if (isAnonymous) {
        setAuthorName('');
        setAuthorEmail('');
        setBotCheckPassed(false);
        setShowBotCheck(false);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    // Show bot check for anonymous users if not already passed
    if (isAnonymous && !botCheckPassed) {
      setShowBotCheck(true);
      return;
    }

    await submitComment();
  };

  const handleBotCheckSuccess = async () => {
    // Set bot check as passed for UI feedback
    setBotCheckPassed(true);
    setShowBotCheck(false);
    
    // Submit comment immediately with bot check passed flag
    if (content.trim()) {
      await submitComment(true);
    }
  };

  const handleBotCheckError = (error: string) => {
    console.error('Bot check error:', error);
    setShowBotCheck(false);
  };

  return (
    <div>
      <h4 className={`font-medium ${themeClasses.foreground} mb-4`}>
        {parentId ? 'Reply to comment' : 'Add a comment'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field - always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author-name" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
              Name (optional)
            </label>
            <Input
              id="author-name"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (or leave blank for Anonymous)"
              disabled={isSubmitting}
              isDarkMode={theme === 'dark'}
            />
          </div>
          
          {/* Email field - only for anonymous users */}
          {/* {isAnonymous && ( */}
          {/*   <div> */}
          {/*     <label htmlFor="author-email" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}> */}
          {/*       Email (optional) */}
          {/*     </label> */}
          {/*     <Input */}
          {/*       id="author-email" */}
          {/*       type="email" */}
          {/*       value={authorEmail} */}
          {/*       onChange={(e) => setAuthorEmail(e.target.value)} */}
          {/*       placeholder="your@email.com" */}
          {/*       disabled={isSubmitting} */}
          {/*       isDarkMode={theme === 'dark'} */}
          {/*     /> */}
          {/*   </div> */}
          {/* )} */}
        </div>

        <div>
          <label htmlFor="comment-content" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
            Comment *
          </label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.background} ${themeClasses.foreground} placeholder:${themeClasses.mutedForeground} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none`}
            placeholder={`Share your thoughts on "${poemTitle}"...`}
            rows={3}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Bot Check for Anonymous Users */}
        {showBotCheck && isAnonymous && (
          <BotCheck
            sessionId={sessionId}
            onSuccess={handleBotCheckSuccess}
            onError={handleBotCheckError}
          />
        )}

        <div className="flex justify-between items-center">
          {/* Bot Check Status for Anonymous Users */}
          {isAnonymous && !showBotCheck && botCheckPassed && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 dark:text-green-400">✓ Verified</span>
            </div>
          )}
          
          <div className={`${isAnonymous && botCheckPassed ? 'ml-auto' : 'w-full flex justify-end'}`}>
            <Button
              type="submit"
              variant="primary"
              isDarkMode={theme === 'dark'}
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : 
               parentId ? 'Reply' : 'Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
