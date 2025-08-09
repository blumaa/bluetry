'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';
import { formatRelativeTime } from '@/lib/utils';
import { getActivity, getPoems, getSubscribers, type Activity } from '@/lib/firebaseService';

// Removed unused User interface


export default function ActivityPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [poems, setPoems] = useState<Array<{id: string; title: string}>>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalPoems: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSubscribers: 0
  });

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      } else {
        loadActivities();
      }
    }
  }, [currentUser, loading, router]);

  const loadActivities = async () => {
    try {
      setLoadingData(true);
      
      // Load real activities from Firebase
      const [activityData, poemsData, subscribers] = await Promise.all([
        getActivity(100), // Get last 100 activities
        getPoems(false), // Get all poems (published and unpublished)
        getSubscribers()
      ]);
      
      setActivities(activityData);
      setPoems(poemsData);
      
      // Calculate stats
      const publishedPoems = poemsData.filter(poem => poem.published);
      setStats({
        totalPoems: publishedPoems.length,
        totalLikes: publishedPoems.reduce((sum, poem) => sum + (poem.likeCount || 0), 0),
        totalComments: publishedPoems.reduce((sum, poem) => sum + (poem.commentCount || 0), 0),
        totalSubscribers: subscribers.length
      });
      
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'poem_created':
      case 'poem_published':
        return '📝';
      case 'poem_liked':
        return '❤️';
      case 'comment_added':
        return '💬';
      case 'subscriber_joined':
        return '📬';
      default:
        return '📊';
    }
  };

  // Removed getActivityColor function - now using consistent primary Button styling

  const getActivityDescription = (activity: Activity) => {
    // Helper function to get poem title - try metadata first, then lookup by poemId
    const getPoemTitle = () => {
      if (activity.metadata?.title) {
        return activity.metadata.title;
      }
      if (activity.poemId) {
        const poem = poems.find(p => p.id === activity.poemId);
        return poem?.title || 'Untitled';
      }
      return 'Untitled';
    };

    switch (activity.type) {
      case 'poem_created':
        return `New poem created: "${getPoemTitle()}"`;
      case 'poem_published':
        return `Poem published: "${getPoemTitle()}"`;
      case 'poem_liked':
        return `Poem "${getPoemTitle()}" received a like`;
      case 'comment_added':
        return `New comment added to "${getPoemTitle()}"`;
      case 'subscriber_joined':
        return `New email subscriber: ${activity.metadata?.email || 'Someone'}`;
      default:
        return 'Unknown activity';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
              Activity
            </h1>
            <p className={themeClasses.mutedForeground}>
              Recent activity and engagement on your poetry platform
            </p>
          </div>
          
          <Link href="/admin/poems">
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
            >
              Manage Poems →
            </Button>
          </Link>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {loadingData ? '...' : stats.totalPoems}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Published Poems</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {loadingData ? '...' : stats.totalLikes}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Likes</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {loadingData ? '...' : stats.totalComments}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Comments</div>
          </div>
          
          <div className={`${themeClasses.card} border ${themeClasses.border} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {loadingData ? '...' : stats.totalSubscribers}
            </div>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Email Subscribers</div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className={`text-xl font-semibold ${themeClasses.foreground} mb-4`}>Recent Activity</h2>
          
          {loadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-20 ${themeClasses.muted} animate-pulse rounded-lg`} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className={`text-xl font-semibold ${themeClasses.foreground} mb-2`}>
                No activity yet
              </h3>
              <p className={themeClasses.mutedForeground}>
                Activity will appear here as people interact with your poems.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 50).map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-4 ${themeClasses.card} border ${themeClasses.border} rounded-lg hover:shadow-sm transition-shadow`}
                >
                  <div className="flex-shrink-0 text-2xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${themeClasses.foreground}`}>
                        {getActivityDescription(activity)}
                      </h3>
                      <span className={`text-xs ${themeClasses.mutedForeground}`}>
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    corners="rounded"
                    isDarkMode={theme === 'dark'}
                    className="px-2 py-1 text-xs pointer-events-none"
                  >
                    {activity.type.replace('_', ' ')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}