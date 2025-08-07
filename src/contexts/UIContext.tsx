'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface UIContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  selectedPoemId: string | null;
  setSelectedPoemId: (id: string | null) => void;
  clearSelectedPoem: () => void;
  isMobile: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  resetPagination: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Will be set properly in useEffect
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPageState] = useState(1);

  useEffect(() => {
    // Check if we're on mobile and adjust sidebar accordingly
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Load saved state from localStorage for desktop only
      const savedSidebarState = localStorage.getItem('sidebarOpen');
      
      if (mobile) {
        // On mobile, sidebar should be closed by default
        setIsSidebarOpen(false);
      } else {
        // On desktop, use saved state or default to open
        if (savedSidebarState !== null) {
          setIsSidebarOpen(JSON.parse(savedSidebarState));
        } else {
          setIsSidebarOpen(true); // Default to open on desktop
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Don't auto-load poem selection - let the main page show the feed by default
    // Poem selection will only be set when user explicitly clicks on a poem

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    
    // Only save state on desktop
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', 'false');
    }
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', 'true');
    }
  };

  const handleSetSelectedPoemId = (id: string | null) => {
    setSelectedPoemId(id);
    if (id) {
      localStorage.setItem('selectedPoemId', id);
    } else {
      localStorage.removeItem('selectedPoemId');
    }
  };

  const clearSelectedPoem = () => {
    setSelectedPoemId(null);
    localStorage.removeItem('selectedPoemId');
  };

  const setCurrentPage = (page: number) => {
    setCurrentPageState(page);
    localStorage.setItem('currentPage', page.toString());
  };

  const resetPagination = () => {
    setCurrentPageState(1);
    localStorage.removeItem('currentPage');
  };

  // Load current page from localStorage on mount
  useEffect(() => {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
      setCurrentPageState(parseInt(savedPage, 10));
    }
  }, []);

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        selectedPoemId,
        setSelectedPoemId: handleSetSelectedPoemId,
        clearSelectedPoem,
        isMobile,
        currentPage,
        setCurrentPage,
        resetPagination,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}