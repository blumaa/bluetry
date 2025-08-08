'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Poem } from '@/types';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime, getPoemUrl } from '@/lib/utils';
import { likePoem, unlikePoem, isPoemLikedByUser } from '@/lib/firebaseService';

interface PoemCardProps {
  poem: Poem;
  showFullContent?: boolean;
}

export function PoemCard({ poem, showFullContent = false }: PoemCardProps) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(poem.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [loadingLikeStatus, setLoadingLikeStatus] = useState(true);

  useEffect(() => {
    const checkLikeStatus = async () => {
      setLoadingLikeStatus(true);
      try {
        if (currentUser) {
          // Authenticated user - check Firebase
          const liked = await isPoemLikedByUser(currentUser.id, poem.id);
          setIsLiked(liked);
        } else {
          // Anonymous user - check localStorage
          const { isLikedPoem } = await import('@/lib/utils');
          const liked = isLikedPoem(poem.id);
          setIsLiked(liked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
        setIsLiked(false);
      } finally {
        setLoadingLikeStatus(false);
      }
    };
    
    checkLikeStatus();
  }, [currentUser, poem.id]);

  useEffect(() => {
    setLikeCount(poem.likeCount);
  }, [poem.likeCount]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    const newLikedState = !wasLiked;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      if (currentUser) {
        // Authenticated user - use Firebase
        if (newLikedState) {
          await likePoem(currentUser.id, poem.id);
        } else {
          await unlikePoem(currentUser.id, poem.id);
        }
      } else {
        // Anonymous user - use localStorage and update poem count
        const { getLikedPoems, addLikedPoem, removeLikedPoem } = await import('@/lib/utils');
        
        if (newLikedState) {
          addLikedPoem(poem.id);
        } else {
          removeLikedPoem(poem.id);
        }
        
        // Update poem like count in Firebase for anonymous users
        // This requires updating the poem document directly
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const poemRef = doc(db, 'poems', poem.id);
        await updateDoc(poemRef, {
          likeCount: increment(newLikedState ? 1 : -1)
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
    const url = `${window.location.origin}${getPoemUrl(poem)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: poem.title,
          url: url,
        });
      } catch {
        // User cancelled or error occurred, fall back to clipboard
        await navigator.clipboard.writeText(url);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('[role="button"]')
    ) {
      return;
    }
    
    // Navigate to poem page
    router.push(getPoemUrl(poem));
  };

  // Use full content or preview based on prop
  const displayContent = showFullContent ? poem.content : poem.content;

  return (
    <article 
      className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
            {poem.title}
          </h2>
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
        <div 
          className="text-foreground leading-relaxed prose prose-lg max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-2"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <button
          onClick={handleLike}
          disabled={isLiking || loadingLikeStatus}
          className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
            isLiked 
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {loadingLikeStatus ? (
            <span className="text-lg animate-pulse">🤍</span>
          ) : (
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
          )}
          <span className="text-sm">{likeCount}</span>
        </button>

        <Link href={`${getPoemUrl(poem)}#comments`}>
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
