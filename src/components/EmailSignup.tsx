'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input } from '@mond-design-system/theme';
import { addSubscriber } from '@/lib/firebaseService';

export function EmailSignup() {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || isSubscribing) return;
    
    setIsSubscribing(true);
    
    try {
      // Use the proper service function
      await addSubscriber(email);
      
      success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (errorObj) {
      console.error('Error subscribing:', errorObj);
      if (errorObj instanceof Error && errorObj.message === 'Email already subscribed') {
        error('This email is already subscribed!');
      } else {
        error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className={`bg-primary/5 rounded-lg p-6 border ${themeClasses.border}`}>
      <div className="text-center mb-4">
        <h3 className={`font-semibold ${themeClasses.foreground} mb-2`}>
          📬 Stay Updated
        </h3>
        <p className={`text-sm ${themeClasses.mutedForeground}`}>
          Subscribe to receive email notifications when new poems are published.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Input
            id="email-signup-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isSubscribing}
            required
            isDarkMode={theme === 'dark'}
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDarkMode={theme === 'dark'}
          disabled={isSubscribing || !email}
          className="w-full"
        >
          {isSubscribing ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
    </div>
  );
}