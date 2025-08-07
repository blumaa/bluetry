'use client';

import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';

export function EmailSignup() {
  const { theme } = useTheme();
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
    <div className="bg-primary/5 rounded-lg p-6 border">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-foreground mb-2">
          📬 Stay Updated
        </h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to receive email notifications when new poems are published.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            disabled={isSubscribing}
            required
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
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}