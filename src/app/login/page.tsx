'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Input } from '@mond-design-system/theme';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear any existing mock authentication
  useEffect(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      // Redirect admin users to activity, regular users to home
      router.push(currentUser.isAdmin ? '/activity' : '/');
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will handle the user state and redirect via useEffect
      // The redirect happens in the useEffect above based on user role
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
      <div className="max-w-md w-full mx-4">
        <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-8 shadow-lg`}>
          {/* Header */}
          {/* <div className="text-center mb-8"> */}
          {/*   <h1 className="text-3xl font-bold text-foreground mb-2"> */}
          {/*     Welcome Back */}
          {/*   </h1> */}
          {/* </div> */}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                required
                isDarkMode={theme === 'dark'}
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
                isDarkMode={theme === 'dark'}
              />
            </div>

            {error && (
              <div className={`${themeClasses.muted} ${themeClasses.mutedForeground} border ${themeClasses.border} rounded-md p-3 text-sm`}>
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
            <Button
              variant="ghost"
              size="sm"
              isDarkMode={theme === 'dark'}
              onClick={() => router.push('/')}
              className="text-sm"
            >
              ← Back to poems
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
