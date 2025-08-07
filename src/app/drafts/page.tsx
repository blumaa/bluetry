'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import { PoemCard } from '@/components/PoemCard';
import { Poem } from '@/types';
import { getDrafts, updatePoem, deletePoem } from '@/lib/firebaseService';

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export default function DraftsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser, loading } = useAuth();
  const [drafts, setDrafts] = useState<Poem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      } else {
        loadDrafts();
      }
    }
  }, [currentUser, loading, router]);

  const loadDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const draftPoems = await getDrafts();
      setDrafts(draftPoems);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handlePublish = async (poemId: string) => {
    try {
      await updatePoem(poemId, { published: true });
      // Reload drafts
      loadDrafts();
    } catch (error) {
      console.error('Error publishing poem:', error);
      alert('Error publishing poem. Please try again.');
    }
  };

  const handleDelete = async (poemId: string) => {
    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      try {
        await deletePoem(poemId);
        // Reload drafts
        loadDrafts();
      } catch (error) {
        console.error('Error deleting poem:', error);
        alert('Error deleting poem. Please try again.');
      }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Drafts
            </h1>
            <p className="text-muted-foreground">
              Manage your unpublished poems ({drafts.length} drafts)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
              onClick={() => router.push('/')}
            >
              ← Back to Home
            </Button>
            <Button
              variant="primary"
              isDarkMode={theme === 'dark'}
              onClick={() => router.push('/create')}
            >
              + New Poem
            </Button>
          </div>
        </div>

        {/* Drafts List */}
        {loadingDrafts ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              No drafts yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start writing your first poem to see it appear here.
            </p>
            <Button
              variant="primary"
              isDarkMode={theme === 'dark'}
              onClick={() => router.push('/create')}
            >
              Create New Poem
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {drafts.map((poem) => (
              <div key={poem.id} className="relative">
                <PoemCard poem={poem} showFullContent={false} />
                
                {/* Draft Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs rounded-full">
                    Draft
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      isDarkMode={theme === 'dark'}
                      onClick={() => handlePublish(poem.id)}
                    >
                      Publish
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      isDarkMode={theme === 'dark'}
                      onClick={() => handleDelete(poem.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}