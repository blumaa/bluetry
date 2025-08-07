'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { Button } from '@mond-design-system/theme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  const { currentUser, loading, logout } = useAuth();
  const { theme } = useTheme();
  const { toggleSidebar, clearSelectedPoem, resetPagination } = useUI();

  const handleHomeClick = () => {
    clearSelectedPoem(); // Clear selected poem to show main feed
    resetPagination(); // Reset pagination to page 1
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
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
            <span className="text-2xl font-bold text-primary">bluetry</span>
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
                      <Link href="/drafts">
                        <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                          Drafts
                        </Button>
                      </Link>
                      <Link href="/activity">
                        <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                          Activity
                        </Button>
                      </Link>
                    </>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {currentUser.displayName}
                    </span>
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
