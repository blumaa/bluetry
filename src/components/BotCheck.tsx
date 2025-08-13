'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Input } from '@mond-design-system/theme';
import { createBotCheck, validateBotCheck } from '@/lib/firebaseService';
import { BotCheck as IBotCheck } from '@/types';

interface BotCheckProps {
  sessionId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export function BotCheck({ sessionId, onSuccess, onError }: BotCheckProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const [botCheck, setBotCheck] = useState<IBotCheck | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    initializeBotCheck();
  }, [sessionId]);

  const initializeBotCheck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const check = await createBotCheck(sessionId);
      setBotCheck(check);
    } catch (err) {
      console.error('Error creating bot check:', err);
      setError('Failed to load verification. Please try again.');
      onError?.('Failed to load verification');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, onError]);

  const handleSubmit = async () => {
    if (!answer.trim() || !botCheck) return;

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateBotCheck(sessionId, answer.trim());
      
      if (isValid) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setError('Too many incorrect attempts. Please refresh and try again.');
          onError?.('Too many incorrect attempts');
        } else {
          setError(`Incorrect answer. ${3 - newAttempts} attempts remaining.`);
          setAnswer('');
          
          // Generate new challenge after failed attempt
          if (newAttempts === 2) {
            await initializeBotCheck();
            setAttempts(0);
          }
        }
      }
    } catch (err) {
      console.error('Error validating bot check:', err);
      setError('Verification failed. Please try again.');
      onError?.('Verification failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRefresh = () => {
    setAnswer('');
    setAttempts(0);
    setError(null);
    initializeBotCheck();
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${themeClasses.muted} rounded-lg border ${themeClasses.border}`}>
        <div className={`text-center ${themeClasses.mutedForeground}`}>
          <div className="animate-pulse">Loading verification...</div>
        </div>
      </div>
    );
  }

  if (!botCheck) {
    return (
      <div className={`p-4 ${themeClasses.muted} rounded-lg border ${themeClasses.border}`}>
        <div className={`text-center ${themeClasses.mutedForeground} space-y-3`}>
          <p>Failed to load verification challenge.</p>
          <Button 
            variant="outline" 
            size="sm" 
            isDarkMode={theme === 'dark'}
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${themeClasses.muted} rounded-lg border ${themeClasses.border}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h4 className={`font-medium ${themeClasses.foreground}`}>
            Verify you're human
          </h4>
        </div>

        {/* Challenge */}
        <div className={`text-center p-3 ${themeClasses.background} rounded border ${themeClasses.border}`}>
          <p className={`text-lg font-mono ${themeClasses.foreground} mb-2`}>
            {(() => {
              if (typeof botCheck.challengeData === 'object' && botCheck.challengeData !== null && 'question' in botCheck.challengeData) {
                return (botCheck.challengeData as { question: string }).question;
              }
              return String(botCheck.challengeData);
            })()}
          </p>
          <p className={`text-sm ${themeClasses.mutedForeground}`}>
            Please solve this simple math problem
          </p>
        </div>

        {/* Answer Form */}
        <div className="space-y-3">
          <div>
            <label htmlFor="bot-check-answer" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
              Your answer:
            </label>
            <div className="flex gap-2">
              <Input
                id="bot-check-answer"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isValidating && answer.trim()) {
                    handleSubmit();
                  }
                }}
                placeholder="Enter answer"
                disabled={isValidating}
                required
                isDarkMode={theme === 'dark'}
                className="flex-1"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                isDarkMode={theme === 'dark'}
                disabled={isValidating || !answer.trim()}
                onClick={handleSubmit}
              >
                {isValidating ? 'Checking...' : 'Post'}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleRefresh}
              className={`text-sm ${themeClasses.mutedForeground} hover:${themeClasses.foreground} underline`}
              disabled={isValidating}
            >
              Get a new question
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className={`text-xs ${themeClasses.mutedForeground} text-center`}>
          This helps prevent spam and automated comments
        </div>
      </div>
    </div>
  );
}