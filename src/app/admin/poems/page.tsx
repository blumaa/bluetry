'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';
import { ManagePoemCard } from '@/components/ManagePoemCard';
import { getPoems, updatePoem, deletePoem } from '@/lib/firebaseService';
import { Poem } from '@/types';

// Removed unused User interface

export default function PoemManagementPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loadingPoems, setLoadingPoems] = useState(true);
  const [updatingPoem, setUpdatingPoem] = useState<string | null>(null);
  const [deletingPoem, setDeletingPoem] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      } else {
        loadPoems();
      }
    }
  }, [currentUser, loading, router]);

  const loadPoems = async () => {
    try {
      setLoadingPoems(true);
      const allPoems = await getPoems(false); // Get both published and draft poems
      setPoems(allPoems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading poems:', error);
    } finally {
      setLoadingPoems(false);
    }
  };

  const handleTogglePublish = async (poemId: string, currentStatus: boolean) => {
    if (updatingPoem) return;
    
    try {
      setUpdatingPoem(poemId);
      await updatePoem(poemId, { published: !currentStatus });
      setPoems(poems.map(poem => 
        poem.id === poemId 
          ? { ...poem, published: !currentStatus }
          : poem
      ));
    } catch (error) {
      console.error('Error updating poem:', error);
    } finally {
      setUpdatingPoem(null);
    }
  };

  const handleTogglePin = async (poemId: string, currentStatus: boolean) => {
    if (updatingPoem) return;
    
    try {
      setUpdatingPoem(poemId);
      await updatePoem(poemId, { pinned: !currentStatus });
      setPoems(poems.map(poem => 
        poem.id === poemId 
          ? { ...poem, pinned: !currentStatus }
          : poem
      ));
    } catch (error) {
      console.error('Error updating poem:', error);
    } finally {
      setUpdatingPoem(null);
    }
  };

  const handleDeletePoem = async (poemId: string) => {
    if (deletingPoem) return;
    
    try {
      setDeletingPoem(poemId);
      await deletePoem(poemId);
      setPoems(poems.filter(poem => poem.id !== poemId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting poem:', error);
    } finally {
      setDeletingPoem(null);
    }
  };

  if (loading || loadingPoems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading poems...</div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
              Poem Management
            </h1>
            <p className={themeClasses.mutedForeground}>
              Manage all your poems - published and drafts
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/activity">
              <Button variant="ghost" isDarkMode={theme === 'dark'}>
                ← Activity Dashboard
              </Button>
            </Link>
            <Link href="/create">
              <Button variant="primary" isDarkMode={theme === 'dark'}>
                + New Poem
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {poems.length}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Poems</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {poems.filter(p => p.published).length}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Published</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {poems.filter(p => !p.published).length}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Drafts</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {poems.filter(p => p.pinned).length}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Pinned</div>
          </div>
        </div>

        {/* Poems Grid */}
        <div className="space-y-4">
          {poems.length === 0 ? (
            <div className={`text-center py-12 ${themeClasses.card} border ${themeClasses.border} rounded-lg`}>
              <div className="text-4xl mb-4">📝</div>
              <h3 className={`text-xl font-semibold ${themeClasses.foreground} mb-2`}>
                No poems found
              </h3>
              <p className={themeClasses.mutedForeground}>
                Create your first poem to get started.
              </p>
            </div>
          ) : (
            poems.map((poem) => (
              <ManagePoemCard
                key={poem.id}
                poem={poem}
                onTogglePublish={handleTogglePublish}
                onTogglePin={handleTogglePin}
                onDelete={(poemId) => setConfirmDeleteId(poemId)}
                isUpdating={updatingPoem === poem.id}
                isDeleting={deletingPoem === poem.id}
              />
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {confirmDeleteId && (
          <div className={`fixed inset-0 ${themeClasses.background}/80 backdrop-blur-sm flex items-center justify-center z-50`}>
            <div className={`${themeClasses.background} border ${themeClasses.border} rounded-lg p-6 max-w-md w-full mx-4`}>
              <h3 className={`text-lg font-semibold ${themeClasses.foreground} mb-4`}>
                Confirm Delete
              </h3>
              <p className={`${themeClasses.mutedForeground} mb-6`}>
                Are you sure you want to delete this poem? This action cannot be undone.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  isDarkMode={theme === 'dark'}
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isDarkMode={theme === 'dark'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => handleDeletePoem(confirmDeleteId)}
                  disabled={deletingPoem === confirmDeleteId}
                >
                  {deletingPoem === confirmDeleteId ? 'Deleting...' : 'Delete Poem'}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}