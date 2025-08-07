'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock authentication
    if (username === 'test' && password === 'test') {
      // Simulate API call delay
      setTimeout(() => {
        // Mock setting admin user in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@bluetry.com',
          displayName: 'Admin User',
          isAdmin: true,
        }));
        
        setIsLoading(false);
        router.push('/admin');
      }, 1000);
    } else {
      setTimeout(() => {
        setError('Invalid username or password. Use "test" for both fields.');
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card border rounded-lg p-8 shadow-lg">
          {/* Header */}
          {/* <div className="text-center mb-8"> */}
          {/*   <h1 className="text-3xl font-bold text-foreground mb-2"> */}
          {/*     Welcome Back */}
          {/*   </h1> */}
          {/* </div> */}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 text-sm dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isDarkMode={theme === 'dark'}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Mock credentials hint */}
          {/* <div className="mt-8 p-4 bg-muted/50 rounded-lg"> */}
          {/*   <h3 className="font-semibold text-foreground text-sm mb-2"> */}
          {/*     Demo Credentials */}
          {/*   </h3> */}
          {/*   <p className="text-xs text-muted-foreground mb-1"> */}
          {/*     Username: <code className="bg-background px-1 rounded">test</code> */}
          {/*   </p> */}
          {/*   <p className="text-xs text-muted-foreground"> */}
          {/*     Password: <code className="bg-background px-1 rounded">test</code> */}
          {/*   </p> */}
          {/* </div> */}

          {/* Back to home */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to poems
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
