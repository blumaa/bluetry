'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import { TiptapEditor } from '@/components/TiptapEditor';
import { createPoem } from '@/lib/firebaseService';

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export default function CreatePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      }
    }
  }, [currentUser, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setNotification({
        message: 'You must be logged in to create poems',
        type: 'error'
      });
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      setNotification({
        message: 'Please fill in both title and content',
        type: 'error'
      });
      return;
    }

    setSaving(true);

    try {
      await createPoem({
        title: title.trim(),
        content: content,
        authorId: currentUser.id,
        published: isPublished,
        pinned: isPinned,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      });

      // Reset form
      setTitle('');
      setContent('');
      setIsPublished(false);
      setIsPinned(false);

      setNotification({
        message: 'Poem saved successfully!',
        type: 'success'
      });
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error saving poem:', error);
      setNotification({
        message: 'Error saving poem. Please try again.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('Are you sure you want to discard your changes?')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}>
            {notification.message}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create New Poem
              </h1>
              <p className="text-muted-foreground">
                Write and publish your poetry
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                isDarkMode={theme === 'dark'}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isDarkMode={theme === 'dark'}
                disabled={saving || !title.trim() || !content.trim()}
              >
                {saving ? 'Saving...' : 'Save Poem'}
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your poem title..."
                disabled={saving}
                required
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content *
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your poem here... Use the toolbar above to format your text."
              />
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                  disabled={saving}
                />
                <span className="text-sm font-medium text-foreground">
                  Publish immediately
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                  disabled={saving || !isPublished}
                />
                <span className={`text-sm font-medium ${
                  isPublished ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  Pin to top (only published poems can be pinned)
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {content && (
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {title || 'Untitled Poem'}
                </h2>
                <div 
                  className="text-foreground whitespace-pre-wrap leading-relaxed font-serif prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}