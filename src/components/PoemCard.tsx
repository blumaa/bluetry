'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { Poem } from '@/types';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime, isLikedPoem, addLikedPoem, removeLikedPoem } from '@/lib/utils';

interface PoemCardProps {
  poem: Poem;
  showFullContent?: boolean;
}

export function PoemCard({ poem, showFullContent = false }: PoemCardProps) {
  const { theme } = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(poem.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(isLikedPoem(poem.id));
  }, [poem.id]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    const newLikedState = !wasLiked;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      const poemRef = doc(db, 'poems', poem.id);
      
      if (newLikedState) {
        // Add like
        addLikedPoem(poem.id);
        await updateDoc(poemRef, {
          likeCount: increment(1)
        });
      } else {
        // Remove like
        removeLikedPoem(poem.id);
        await updateDoc(poemRef, {
          likeCount: increment(-1)
        });
      }
    } catch (err) {
      console.error('Error updating like:', err);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/poem/${poem.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: poem.title,
          url: url,
        });
      } catch {
        // User cancelled or error occurred, fall back to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      // You might want to show a toast notification here
    }
  };

  // Use full content or preview based on prop
  const displayContent = showFullContent ? poem.content : poem.content;

  return (
    <article className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link href={`/poem/${poem.id}`}>
            <h2 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              {poem.title}
            </h2>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {formatRelativeTime(poem.createdAt)}
            {poem.pinned && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                📌 Pinned
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Poem Content */}
      <div className="mb-4">
        <div className="text-foreground whitespace-pre-wrap leading-relaxed ">
          {displayContent}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
            isLiked 
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
          <span className="text-sm">{likeCount}</span>
        </button>

        <Link href={`/poem/${poem.id}#comments`}>
          <button className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <span className="text-lg">💬</span>
            <span className="text-sm">{poem.commentCount}</span>
          </button>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <span className="text-lg">🔗</span>
          <span className="text-sm">Share</span>
        </button>
      </div>
    </article>
  );
}
