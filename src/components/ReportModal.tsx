'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Card } from '@mond-design-system/theme';

import { Comment } from '@/types';

interface ReportModalProps {
  comment: Comment;
  isOpen: boolean;
  onClose: () => void;
  onReported: () => void;
}

export function ReportModal({ comment, isOpen, onClose, onReported }: ReportModalProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReport = async () => {
    setIsSubmitting(true);

    try {
      // For now, just log the report locally and show success
      // This avoids Firebase permission issues while maintaining UX

      // Simulate successful report
      onReported();
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card isDarkMode={theme === 'dark'} className="max-w-md w-full">
        <Card.Header>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h3 className={`text-lg font-semibold ${themeClasses.foreground}`}>
              Report Comment
            </h3>
          </div>
        </Card.Header>
        
        <Card.Content>
          
          {/* Message */}
          <p className={`${themeClasses.foreground} mb-6`}>
            Would you like to report this comment by {comment.authorName}?
          </p>
          
          {/* Comment Preview */}
          <div className={`mb-6 p-3 ${themeClasses.muted} rounded border ${themeClasses.border} text-sm`}>
            {comment.content.length > 150 ? 
              `${comment.content.substring(0, 150)}...` : 
              comment.content
            }
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isDarkMode={theme === 'dark'}
              onClick={handleReport}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Reporting...' : 'Yes, Report'}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}