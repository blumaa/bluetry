'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime, getPoemUrl } from '@/lib/utils';
import { Poem } from '@/types';

interface ManagePoemCardProps {
  poem: Poem;
  onTogglePublish: (poemId: string, currentStatus: boolean) => Promise<void>;
  onTogglePin: (poemId: string, currentStatus: boolean) => Promise<void>;
  onDelete: (poemId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function ManagePoemCard({ 
  poem, 
  onTogglePublish, 
  onTogglePin, 
  onDelete, 
  isUpdating, 
  isDeleting 
}: ManagePoemCardProps) {
  const { theme } = useTheme();

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link href={getPoemUrl(poem)} className="group">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer">
              {poem.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {poem.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            poem.published 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}>
            {poem.published ? 'Published' : 'Draft'}
          </span>
          {poem.pinned && (
            <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
              📌 Pinned
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span>Created {formatRelativeTime(poem.createdAt)}</span>
        <span>•</span>
        <span>{poem.likeCount || 0} likes</span>
        <span>•</span>
        <span>{poem.commentCount || 0} comments</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/create?edit=${poem.id}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            isDarkMode={theme === 'dark'}
            className="px-3 py-1 text-sm"
          >
            ✏️ Edit
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          isDarkMode={theme === 'dark'}
          className="px-3 py-1 text-sm"
          onClick={() => onTogglePublish(poem.id, poem.published)}
          disabled={isUpdating}
        >
          {isUpdating ? '⏳' : (poem.published ? '📝' : '📖')}
          {poem.published ? ' Unpublish' : ' Publish'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          isDarkMode={theme === 'dark'}
          className="px-3 py-1 text-sm"
          onClick={() => onTogglePin(poem.id, poem.pinned)}
          disabled={isUpdating}
        >
          {isUpdating ? '⏳' : (poem.pinned ? '📌' : '📄')}
          {poem.pinned ? ' Unpin' : ' Pin'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          isDarkMode={theme === 'dark'}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(poem.id)}
          disabled={isDeleting}
        >
          {isDeleting ? '⏳' : '🗑️'} Delete
        </Button>
      </div>
    </div>
  );
}