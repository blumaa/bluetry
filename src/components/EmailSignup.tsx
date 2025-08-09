'use client';

import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Input } from '@mond-design-system/theme';

export function EmailSignup() {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || isSubscribing) return;
    
    setIsSubscribing(true);
    setMessage('');
    
    try {
      // Check if email already exists
      const q = query(
        collection(db, 'subscribers'),
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setMessage('This email is already subscribed!');
        setIsSuccess(false);
      } else {
        // Add new subscriber
        await addDoc(collection(db, 'subscribers'), {
          email: email.toLowerCase(),
          subscribed: true,
          createdAt: new Date(),
        });
        
        setMessage('Subscribed');
        setIsSuccess(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage('Something went wrong. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsSubscribing(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setIsSuccess(false);
      }, 5000);
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
        
        {message && (
          <div className={`text-sm p-3 rounded-md ${
            isSuccess 
              ? 'bg-primary/10 text-primary border border-primary/20' 
              : `${themeClasses.muted} ${themeClasses.mutedForeground} border ${themeClasses.border}`
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}