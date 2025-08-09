'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Poem } from '@/types';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime, getPoemUrl } from '@/lib/utils';
import { likePoem, unlikePoem, isPoemLikedByUser } from '@/lib/firebaseService';

interface PoemCardProps {
  poem: Poem;
}

export function PoemCard({ poem }: PoemCardProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(poem.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [loadingLikeStatus, setLoadingLikeStatus] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

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
        const { addLikedPoem, removeLikedPoem } = await import('@/lib/utils');
        
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
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleNavigateToPoem = () => {
    console.log('handleNavigateToPoem called, navigating to:', getPoemUrl(poem));
    // Navigate to poem page
    router.push(getPoemUrl(poem));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('Card clicked!', e.target);
    
    // Don't navigate if clicking on interactive elements or poem content
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('[role="button"]') ||
      target.closest('.poem-content')
    ) {
      console.log('Clicked on interactive element, not navigating');
      return;
    }
    
    console.log('About to navigate to poem page');
    // Navigate to poem page
    handleNavigateToPoem();
  };

  const displayContent = poem.content;

  return (
    <article 
      className={`${themeClasses.card} border ${themeClasses.border} rounded-lg hover:shadow-md transition-shadow cursor-pointer`}
      onClick={handleCardClick}
    >
      {/* Clickable padding wrapper */}
      <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 
            className={`text-xl font-semibold ${themeClasses.foreground} hover:text-primary-500 transition-colors cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              handleNavigateToPoem();
            }}
          >
            {poem.title}
          </h2>
          <p className={`text-sm ${themeClasses.mutedForeground} mt-1`}>
            {formatRelativeTime(poem.createdAt)}
            {poem.pinned && (
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${themeClasses.conditional('bg-primary-100 text-primary-600', 'bg-primary-900/20 text-primary-400')}`}>
                📌 Pinned
              </span>
            )}
          </p>
        </div>
      </div>

        {/* Poem Content */}
        <div className="mb-4 poem-content">
          <div 
            className={`leading-relaxed prose prose-lg max-w-none prose-p:my-2 prose-headings:my-2 ${themeClasses.conditional('[&_*]:!text-[#414A4C]', '[&_*]:!text-[#DDE6ED]')}`}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-2 pt-4 border-t ${themeClasses.border}`}>
          <Button
            variant="ghost"
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={isLiking || loadingLikeStatus}
            className={`flex items-center gap-2 px-3 py-1 ${
              isLiked ? `text-primary-500 ${themeClasses.conditional('hover:bg-primary-50', 'hover:bg-primary-900/20')}` : ''
            }`}
          >
            {loadingLikeStatus ? (
              <span className="text-lg animate-pulse">🤍</span>
            ) : (
              <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
            )}
            <span className="text-sm">{likeCount}</span>
          </Button>

          <Link href={`${getPoemUrl(poem)}#comments`}>
            <Button
              variant="ghost"
              size="sm"
              isDarkMode={theme === 'dark'}
              className="flex items-center gap-2 px-3 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">💬</span>
              <span className="text-sm">{poem.commentCount}</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex items-center gap-2 px-3 py-1"
          >
            <span className="text-lg">🔗</span>
            <span className="text-sm">{showCopied ? 'Copied!' : 'Share'}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
