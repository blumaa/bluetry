'use client';

// Removed unused useState import
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Card } from '@mond-design-system/theme';
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
  const themeClasses = useThemeClasses();

  return (
    <Card 
      isDarkMode={theme === 'dark'}
      className="hover:shadow-sm transition-shadow"
    >
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={getPoemUrl(poem)} className="group">
              <Card.Title as="h3" className="text-lg font-semibold group-hover:text-primary transition-colors cursor-pointer">
                {poem.title}
              </Card.Title>
            </Link>
            <Card.Subtitle className={`text-sm ${themeClasses.mutedForeground} mt-1 truncate`}>
              {poem.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </Card.Subtitle>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
          <Button
            variant={poem.published ? "primary" : "ghost"}
            size="sm"
            corners="rounded"
            isDarkMode={theme === 'dark'}
            className="px-2 py-1 text-xs pointer-events-none"
          >
            {poem.published ? 'Published' : 'Draft'}
          </Button>
          {poem.pinned && (
            <Button
              variant="primary"
              size="sm"
              corners="rounded"
              isDarkMode={theme === 'dark'}
              className="px-2 py-1 text-xs pointer-events-none"
            >
              📌 Pinned
            </Button>
          )}
        </div>
        </div>
      </Card.Header>

      <Card.Content>
        {/* Stats */}
        <div className={`flex items-center gap-4 text-sm ${themeClasses.mutedForeground}`}>
        <span>Created {formatRelativeTime(poem.createdAt)}</span>
        <span>•</span>
        <span>{poem.likeCount || 0} likes</span>
        <span>•</span>
        <span>{poem.commentCount || 0} comments</span>
        </div>
      </Card.Content>

      <Card.Footer>
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
          className={`px-3 py-1 text-sm ${themeClasses.mutedForeground} hover:${themeClasses.foreground} hover:${themeClasses.muted}`}
          onClick={() => onDelete(poem.id)}
          disabled={isDeleting}
        >
          {isDeleting ? '⏳' : '🗑️'} Delete
        </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}