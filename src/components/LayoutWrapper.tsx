'use client';

import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Header } from '@/components/Header';
import { PoemSidebar } from '@/components/PoemSidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const themeClasses = useThemeClasses();
  
  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <Header />
      <div className="flex h-[calc(100vh-3.5rem)]">
        <PoemSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}