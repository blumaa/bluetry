'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime } from '@/lib/utils';
import { 
  addComment, 
  listenToComments, 
  type Comment 
} from '@/lib/firebaseService';

interface CommentsSectionProps {
  poemId: string;
  poemTitle: string;
}

export function CommentsSection({ poemId, poemTitle }: CommentsSectionProps) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for comments
    const unsubscribe = listenToComments(poemId, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, [poemId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newComment.trim()) return;

    setIsSubmitting(true);

    try {
      await addComment({
        poemId,
        authorId: currentUser.id,
        content: newComment.trim(),
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-8" id="comments">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                Add a comment
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                placeholder={`Share your thoughts on "${poemTitle}"...`}
                rows={3}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isDarkMode={theme === 'dark'}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <p className="text-muted-foreground text-center">
            <a href="/login" className="text-primary hover:underline">Sign in</a> to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {comment.authorId.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {comment.authorId}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
}