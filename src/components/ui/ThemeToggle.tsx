'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      isDarkMode={theme === 'dark'}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}