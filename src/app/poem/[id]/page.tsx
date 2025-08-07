'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PoemCard } from '@/components/PoemCard';
import { Button } from '@mond-design-system/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Poem } from '@/types';
import mockPoemsData from '@/data/mock-poems.json';

export default function PoemPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPoem = () => {
      try {
        const poemId = params.id as string;
        const foundPoem = mockPoemsData.find((p) => p.id === poemId);

        if (foundPoem) {
          setPoem({
            ...foundPoem,
            createdAt: new Date(foundPoem.createdAt),
            updatedAt: new Date(foundPoem.updatedAt),
          });
        }
      } catch (error) {
        console.error('Error loading poem:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPoem();
  }, [params.id]);

  const handleBackClick = () => {
    router.push('/');
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
            ← Back to Poems
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="">
          {/* Poem Display */}
          <PoemCard poem={poem} showFullContent={true} />

          {/* Additional Actions */}
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              ← Return to All Poems
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
