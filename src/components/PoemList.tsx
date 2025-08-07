'use client';

import { useEffect, useState } from 'react';
import { Poem } from '@/types';
import { PoemCard } from './PoemCard';
import mockPoemsData from '@/data/mock-poems.json';

export function PoemList() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [pinnedPoems, setPinnedPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMockPoems = () => {
      try {
        // Convert the mock data to proper Poem objects with Date objects
        const allPoems: Poem[] = mockPoemsData.map(poem => ({
          ...poem,
          createdAt: new Date(poem.createdAt),
          updatedAt: new Date(poem.updatedAt),
        }));

        // Separate pinned and regular poems
        const pinnedPoemsData = allPoems.filter(poem => poem.pinned && poem.published);
        const regularPoemsData = allPoems.filter(poem => !poem.pinned && poem.published);

        setPinnedPoems(pinnedPoemsData);
        setPoems(regularPoemsData);
      } catch (error) {
        console.error('Error loading mock poems:', error);
      } finally {
        setLoading(false);
      }
    };

    // Simulate a small loading delay for better UX
    setTimeout(loadMockPoems, 500);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pinned Poems */}
      {pinnedPoems.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Pinned Poems
          </h2>
          <div className="space-y-6">
            {pinnedPoems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Poems */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-foreground">
          {pinnedPoems.length > 0 ? 'Latest Poems' : 'Poems'}
        </h2>
        {poems.length > 0 ? (
          <div className="space-y-6">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No poems have been published yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for beautiful poetry to discover!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}