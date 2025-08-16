'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Image from 'next/image';

export function Header() {
  const { currentUser, loading, logout } = useAuth();
  const { theme } = useTheme();
  const { toggleSidebar, clearSelectedPoem, resetPagination } = useUI();
  const themeClasses = useThemeClasses();


  const handleHomeClick = () => {
    clearSelectedPoem(); // Clear selected poem to show main feed
    resetPagination(); // Reset pagination to page 1
  };

  return (
    <header className={`sticky top-0 z-50 w-full ${themeClasses.background}/95 backdrop-blur supports-[backdrop-filter]:${themeClasses.background}/60`}>
      <div className={`flex h-14 items-center justify-between px-4 border ${themeClasses.border}`}>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            isDarkMode={theme === 'dark'}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </Button>
          <Link href="/" className="flex items-center space-x-2" onClick={handleHomeClick}>
            <span className={`text-2xl font-bold ${themeClasses.foreground}`}>bluetry</span>
            <Image 
              src="/blue-tree.svg" 
              alt="Bluetry Logo" 
              width={28} 
              height={28} 
              className="flex-shrink-0"
            />
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          <ThemeToggle />
          
          {!loading && (
            <>
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  {currentUser.isAdmin && (
                    <>
                      <Link href="/create">
                        <Button variant="outline" size="sm" isDarkMode={theme === 'dark'}>
                          New Poem
                        </Button>
                      </Link>
                      <Link href="/admin/poems">
                        <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                          Manage Poems
                        </Button>
                      </Link>
                      <Link href="/activity">
                        <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                          Activity
                        </Button>
                      </Link>
                      <Link href="/admin/subscribers">
                        <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                          Subscribers
                        </Button>
                      </Link>
                    </>
                  )}
                  <div className="flex items-center space-x-2">
                    <Link href="/admin">
                      <span className={`text-sm ${themeClasses.mutedForeground} hover:${themeClasses.foreground} transition-colors cursor-pointer`}>
                        {currentUser.displayName}
                      </span>
                    </Link>
                    <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'} onClick={logout}>
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm" isDarkMode={theme === 'dark'}>
                    Login
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
