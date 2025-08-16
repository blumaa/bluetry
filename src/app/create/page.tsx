'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input } from '@mond-design-system/theme';
import { PoemCard } from '@/components/PoemCard';
import { Poem } from '@/types';
import { TiptapEditor } from '@/components/TiptapEditor';
import { createPoem, updatePoem, getPoemById, getSubscribers } from '@/lib/firebaseService';

// Removed unused User interface

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingPoem, setLoadingPoem] = useState(false);
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);

  // Edit mode detection
  const editPoemId = searchParams.get('edit');
  const isEditMode = !!editPoemId;

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const loadPoemForEditing = useCallback(async (poemId: string) => {
    try {
      setLoadingPoem(true);
      const poem = await getPoemById(poemId);
      if (poem) {
        setTitle(poem.title);
        setContent(poem.content);
        setIsPublished(poem.published);
        setIsPinned(poem.pinned);
        setSendEmail(false); // Reset for existing poems
        setSelectedPoem({
          id: poemId,
          title: poem.title,
          content: poem.content,
          authorId: poem.authorId,
          published: poem.published,
          pinned: poem.pinned,
          likeCount: poem.likeCount || 0,
          commentCount: poem.commentCount || 0,
          createdAt: poem.createdAt,
          updatedAt: poem.updatedAt,
        });
      } else {
        error('Poem not found');
      }
    } catch (errorObj) {
      console.error('Error loading poem:', errorObj);
      error('Error loading poem for editing');
    } finally {
      setLoadingPoem(false);
    }
  }, [error]);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      } else if (isEditMode && editPoemId) {
        loadPoemForEditing(editPoemId);
      }
    }
  }, [currentUser, loading, router, isEditMode, editPoemId, loadPoemForEditing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      error(`You must be logged in to ${isEditMode ? 'edit' : 'create'} poems`);
      return;
    }

    if (!title.trim() || !content.trim()) {
      error('Please fill in both title and content');
      return;
    }

    setSaving(true);

    try {
      if (isEditMode && editPoemId) {
        // Update existing poem
        await updatePoem(editPoemId, {
          title: title.trim(),
          content: content,
          published: isPublished,
          pinned: isPinned,
        });
      } else {
        // Create new poem
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
      }

      // Send email to subscribers if checkbox is checked and poem is published
      if (isPublished && sendEmail) {
        try {
          const subscribers = await getSubscribers();
          if (subscribers && subscribers.length > 0) {
            const emailResponse = await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subject: `New poem: ${title.trim()}`,
                message: `A new poem has been published on bluetry!\n\n"${title.trim()}"\n\n${content.replace(/<[^>]*>/g, '')}\n\nRead the full poem and more at ${window.location.origin}`,
                subscribers: subscribers,
              }),
            });

            const emailResult = await emailResponse.json();
            if (emailResult.success) {
              success(`Poem ${isEditMode ? 'updated' : 'saved'} and email sent to ${emailResult.sent} subscribers!`);
            } else {
              success(`Poem ${isEditMode ? 'updated' : 'saved'} successfully!`);
              error(`Failed to send email: ${emailResult.error}`);
            }
          } else {
            success(`Poem ${isEditMode ? 'updated' : 'saved'} successfully! No subscribers to email.`);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          success(`Poem ${isEditMode ? 'updated' : 'saved'} successfully!`);
          error('Failed to send email to subscribers.');
        }
      } else {
        success(`Poem ${isEditMode ? 'updated' : 'saved'} successfully!`);
      }

      if (!isEditMode) {
        // Reset form only for new poems
        setTitle('');
        setContent('');
        setIsPublished(false);
        setIsPinned(false);
        setSendEmail(false);
      }

      // Redirect after showing success message
      setTimeout(() => {
        router.push(isEditMode ? '/admin/poems' : '/');
      }, 1500);
    } catch (errorObj) {
      console.error('Error saving poem:', errorObj);
      error('Error saving poem. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      // For now, just navigate - we could add a modal confirmation later
      router.push(isEditMode ? '/admin/poems' : '/');
    } else {
      router.push(isEditMode ? '/admin/poems' : '/');
    }
  };

  if (loading || loadingPoem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">{loadingPoem ? 'Loading poem...' : 'Loading...'}</div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
                {isEditMode ? 'Edit Poem' : 'Create New Poem'}
              </h1>
              <p className={themeClasses.mutedForeground}>
                {isEditMode ? 'Update your poem' : 'Write and publish your poetry'}
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
                disabled={saving || loadingPoem || !title.trim() || !content.trim()}
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Poem' : 'Save Poem'}
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}
              >
                Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your poem title..."
                disabled={saving}
                required
                isDarkMode={theme === 'dark'}
                className="text-lg"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
                Content *
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your poem here... Use the toolbar above to format your text."
              />
            </div>

            {/* Options */}
            <div className="flex gap-3 items-center ">
              <Input
                id="publish-checkbox"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={saving}
                isDarkMode={theme === 'dark'}
              />
              <span className={`text-sm font-medium ${themeClasses.foreground}`}>
                Publish immediately
              </span>

              <Input
                id="pin-checkbox"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                disabled={saving || !isPublished}
                isDarkMode={theme === 'dark'}
              />
              <span
                className={`text-sm font-medium ${
                  isPublished ? themeClasses.foreground : themeClasses.mutedForeground
                }`}
              >
                Pin
              </span>

              <Input
                id="email-checkbox"
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={saving || !isPublished}
                isDarkMode={theme === 'dark'}
              />
              <span
                className={`text-sm font-medium ${
                  isPublished ? themeClasses.foreground : themeClasses.mutedForeground
                }`}
              >
                Send poem to subscribers via email
              </span>
            </div>
          </div>

          {/* Preview */}
          {(title || content) && (
            <div className="border-t pt-8">
              <h3 className={`text-lg font-semibold ${themeClasses.foreground} mb-4`}>Preview</h3>
              <PoemCard poem={{
                id: isEditMode ? (selectedPoem?.id || 'preview') : 'preview',
                title: title || 'Untitled Poem',
                content: content || '',
                authorId: currentUser?.id || '',
                published: isPublished,
                pinned: isPinned,
                likeCount: selectedPoem?.likeCount || 0,
                commentCount: selectedPoem?.commentCount || 0,
                createdAt: selectedPoem?.createdAt || new Date(),
                updatedAt: selectedPoem?.updatedAt || new Date(),
              }} />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}
