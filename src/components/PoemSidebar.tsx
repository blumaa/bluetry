'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '@/contexts/UIContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import { Poem } from '@/types';
import { formatRelativeTime, getPoemUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getPinnedPoems, listenToPoems } from '@/lib/firebaseService';

interface PoemSidebarProps {
  onPoemSelect: (poem: Poem) => void;
}

export function PoemSidebar({ onPoemSelect }: PoemSidebarProps) {
  const { isSidebarOpen, closeSidebar, selectedPoemId, setSelectedPoemId, isMobile } = useUI();
  const { theme } = useTheme();
  const router = useRouter();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [pinnedPoems, setPinnedPoems] = useState<Poem[]>([]);

  useEffect(() => {
    // Load pinned poems
    const loadPinnedPoems = async () => {
      try {
        const pinned = await getPinnedPoems();
        setPinnedPoems(pinned);
      } catch (error) {
        console.error('Error loading pinned poems:', error);
      }
    };

    // Set up real-time listener for regular poems (excluding pinned ones)
    const unsubscribe = listenToPoems((allPoems) => {
      const regular = allPoems.filter(poem => !poem.pinned);
      setPoems(regular.slice(0, 20)); // Limit to most recent 20 for sidebar
    });

    loadPinnedPoems();

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const handlePoemClick = (poem: Poem) => {
    // Navigate to poem page (same behavior as clicking poem cards)
    router.push(getPoemUrl(poem));
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      closeSidebar();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Poems</h2>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          isDarkMode={theme === 'dark'}
          onClick={closeSidebar}
          className="lg:hidden"
        >
          ✕
        </Button>
      </div>

      {/* Poem List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Poems */}
        {pinnedPoems.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              📌 Pinned Poems
            </h3>
            <div className="space-y-2">
              {pinnedPoems.map((poem) => (
                <PoemListItem
                  key={poem.id}
                  poem={poem}
                  isSelected={selectedPoemId === poem.id}
                  onClick={() => handlePoemClick(poem)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Poems */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {pinnedPoems.length > 0 ? 'Latest Poems' : 'All Poems'}
          </h3>
          <div className="space-y-2">
            {poems.map((poem) => (
              <PoemListItem
                key={poem.id}
                poem={poem}
                isSelected={selectedPoemId === poem.id}
                onClick={() => handlePoemClick(poem)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[80vw] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? 320 : 0,
        opacity: isSidebarOpen ? 1 : 0,
      }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="hidden lg:block h-full overflow-hidden"
    >
      {isSidebarOpen && sidebarContent}
    </motion.aside>
  );
}

interface PoemListItemProps {
  poem: Poem;
  isSelected: boolean;
  onClick: () => void;
}

function PoemListItem({ poem, isSelected, onClick }: PoemListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        isSelected
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      }`}
    >
      <div className="space-y-1">
        <h4 className="font-medium text-sm line-clamp-2 leading-tight">
          {poem.title}
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <span>{formatRelativeTime(poem.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span>❤️ {poem.likeCount}</span>
            <span>💬 {poem.commentCount}</span>
          </div>
        </div>
      </div>
    </button>
  );
}