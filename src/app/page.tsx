'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PoemCard } from '@/components/PoemCard';
import { EmailSignup } from '@/components/EmailSignup';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';
import { Poem } from '@/types';
import { listenToPoems } from '@/lib/firebaseService';

const POEMS_PER_PAGE = 5;

export default function Home() {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentPage, setCurrentPage } = useUI();
  const searchParams = useSearchParams();
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [allPoems, setAllPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  // Clear any stored poem selection on page load to ensure we show the main feed
  useEffect(() => {
    localStorage.removeItem('selectedPoemId');
    
    // Check for page parameter in URL and update current page
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (pageNumber > 0) {
        setCurrentPage(pageNumber);
      }
    }
  }, [searchParams, setCurrentPage]);

  useEffect(() => {
    // Set up real-time listener for poems
    const unsubscribe = listenToPoems((poems) => {
      // Filter out pinned poems from main feed
      const publishedPoems = poems.filter(poem => poem.published);
      setAllPoems(publishedPoems);
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Removed unused handlePoemSelect function

  // Pagination logic
  const totalPages = Math.ceil(allPoems.length / POEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * POEMS_PER_PAGE;
  const currentPoems = allPoems.slice(startIndex, startIndex + POEMS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  console.log('currentPoems', currentPoems);
  return (
    <div className="flex flex-1">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {selectedPoem ? (
            // Individual poem view (when selected from sidebar)
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    isDarkMode={theme === 'dark'}
                    onClick={() => setSelectedPoem(null)}
                    className="flex items-center gap-2"
                  >
                    ← Back to All Poems
                  </Button>
                </div>
                <div className="text-center">
                  <h1 className={`text-2xl font-bold ${themeClasses.foreground} mb-2`}>{selectedPoem.title}</h1>
                </div>
                <PoemCard poem={selectedPoem} />
              </div>
            ) : (
              // Main poem feed with pagination
              <div className="space-y-8">
                <div className="text-center">
                  {/* <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to bluetry</h1> */}
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-4">
                      <Button
                        variant="outline"
                        isDarkMode={theme === 'dark'}
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        ←
                      </Button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'primary' : 'ghost'}
                            size="sm"
                            isDarkMode={theme === 'dark'}
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        isDarkMode={theme === 'dark'}
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        →
                      </Button>
                    </div>
                  )}

                  {/* Page info */}
                  <div className={`text-center text-sm ${themeClasses.mutedForeground}`}>
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + POEMS_PER_PAGE, allPoems.length)} of {allPoems.length}{' '}
                    poems
                    {currentPage > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`h-48 ${themeClasses.muted} animate-pulse rounded-lg`} />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Poems List */}
                    <div className="space-y-8">
                      {currentPoems.map((poem) => (
                        <PoemCard key={poem.id} poem={poem} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Right Sidebar - Only on larger screens */}
      <aside className={`hidden xl:block w-80 border-l ${themeClasses.border} overflow-y-auto`}>
        <div className="p-6 space-y-6">
          <EmailSignup />

        {/*   <div className="bg-muted/50 rounded-lg p-6"> */}
        {/*     <h3 className="font-semibold text-foreground mb-3">About bluetry</h3> */}
        {/*     <p className="text-sm text-muted-foreground"> */}
        {/*       Discover beautiful poetry and share your own verses with a community that */}
        {/*       appreciates the art of words. */}
        {/*     </p> */}
        {/*   </div> */}
        </div>
      </aside>
    </div>
  );
}
