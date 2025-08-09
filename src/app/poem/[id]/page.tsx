'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PoemCard } from '@/components/PoemCard';
// import { CommentsSection } from '@/components/CommentsSection'; // Commented out until Firebase index is created
import { Button } from '@mond-design-system/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Poem } from '@/types';
import { findPoemBySlugOrId } from '@/lib/utils';
import { getPoems } from '@/lib/firebaseService';

export default function PoemPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPoem = async () => {
      try {
        const slugOrId = params.id as string;
        // Anonymous users can only see published poems, authenticated users can see all
        const publishedOnly = !currentUser;
        const poems = await getPoems(publishedOnly);
        
        const foundPoem = findPoemBySlugOrId(poems, slugOrId);

        if (foundPoem) {
          setPoem(foundPoem);
        }
      } catch (error) {
        console.error('Error loading poem:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPoem();
  }, [params.id, currentUser]);

  const handleBackClick = () => {
    // Use router.back() for more reliable navigation
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home if no history
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted w-64 rounded mb-4"></div>
          <div className="h-48 bg-muted w-96 rounded"></div>
        </div>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Poem Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The poem you're looking for doesn't exist or may have been removed.
          </p>
          <Button variant="primary" isDarkMode={theme === 'dark'} onClick={handleBackClick}>
            ←
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Poem Display */}
          <PoemCard poem={poem} />

          {/* Comments Section - Temporarily disabled until Firebase index is created */}
          {/* <CommentsSection poemId={poem.id} poemTitle={poem.title} /> */}

          {/* Additional Actions */}
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              ←
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
