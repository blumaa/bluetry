'use client';

import { useToast, Toast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();

  if (toasts.length === 0) return null;

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default:
        return `${themeClasses.background} ${themeClasses.border} ${themeClasses.foreground}`;
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            transform transition-all duration-300 ease-in-out
            ${index === 0 ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'}
            animate-in slide-in-from-top-2 fade-in-0
            ${getToastStyles(toast.type)}
            border rounded-lg p-4 shadow-lg backdrop-blur-sm
            flex items-start gap-3
          `}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="flex-shrink-0 text-lg">
            {getIcon(toast.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed break-words">
              {toast.message}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            isDarkMode={theme === 'dark'}
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 -m-1 p-1 opacity-70 hover:opacity-100"
            aria-label="Close notification"
          >
            ✕
          </Button>
        </div>
      ))}
    </div>
  );
}