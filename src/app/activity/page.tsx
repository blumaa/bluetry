'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Card } from '@mond-design-system/theme';
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
  const [activityFilter, setActivityFilter] = useState<'all' | 'comments' | 'poems' | 'reports'>('all');
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

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    switch (activityFilter) {
      case 'comments':
        return ['comment_added', 'comment_liked', 'comment_replied', 'comment_reported', 'comment_deleted'].includes(activity.type);
      case 'poems':
        return ['poem_created', 'poem_published', 'poem_liked'].includes(activity.type);
      case 'reports':
        return activity.type === 'comment_reported';
      default:
        return true;
    }
  });

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'poem_created':
      case 'poem_published':
        return '📝';
      case 'poem_liked':
        return '❤️';
      case 'comment_added':
        return '💬';
      case 'comment_liked':
        return '❤️';
      case 'comment_replied':
        return '↩️';
      case 'comment_reported':
        return '⚠️';
      case 'comment_deleted':
        return '🗑️';
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

    const metadata = activity.metadata || {};
    const userName = activity.userId === 'anonymous' ? 'Anonymous user' : 'User';

    switch (activity.type) {
      case 'poem_created':
        return `New poem created: "${getPoemTitle()}"`;
      case 'poem_published':
        return `Poem published: "${getPoemTitle()}"`;
      case 'poem_liked':
        return `Poem "${getPoemTitle()}" received a like`;
      case 'comment_added':
        return `${userName} commented on "${getPoemTitle()}"`;
      case 'comment_liked':
        return `${userName} liked a comment`;
      case 'comment_replied':
        return `${userName} replied to a comment on "${getPoemTitle()}"`;
      case 'comment_reported':
        return `${userName} reported a comment on "${getPoemTitle()}"`;
      case 'comment_deleted':
        return `Admin deleted a comment by ${metadata.originalAuthor} on "${getPoemTitle()}"`;
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
    <div className="max-w-6xl mx-auto p-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
            Activity Dashboard
          </h1>
          <p className={themeClasses.mutedForeground}>
            Recent activity and engagement on your poetry platform
          </p>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <div className={`text-sm ${themeClasses.mutedForeground}`}>Published Poems</div>
            </Card.Header>
            <Card.Content className="p-4">
              <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
                {loadingData ? '...' : stats.totalPoems}
              </div>
            </Card.Content>
          </Card>
          
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Likes</div>
            </Card.Header>
            <Card.Content className="p-4">
              <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
                {loadingData ? '...' : stats.totalLikes}
              </div>
            </Card.Content>
          </Card>
          
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Comments</div>
            </Card.Header>
            <Card.Content className="p-4">
              <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
                {loadingData ? '...' : stats.totalComments}
              </div>
            </Card.Content>
          </Card>
          
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <div className={`text-sm ${themeClasses.mutedForeground}`}>Email Subscribers</div>
            </Card.Header>
            <Card.Content className="p-4">
              <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
                {loadingData ? '...' : stats.totalSubscribers}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>Recent Activity</h2>
            
            {/* Activity Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['all', 'comments', 'poems', 'reports'].map((filter) => (
                <Button
                  key={filter}
                  variant={activityFilter === filter ? 'primary' : 'outline'}
                  size="sm"
                  isDarkMode={theme === 'dark'}
                  onClick={() => setActivityFilter(filter as 'all' | 'comments' | 'poems' | 'reports')}
                  className="px-4 py-2 text-sm"
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {/* {filter === 'reports' && activities.filter(a => a.type === 'comment_reported').length > 0 && ( */}
                  {/*   <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"> */}
                  {/*     {activities.filter(a => a.type === 'comment_reported').length} */}
                  {/*   </span> */}
                  {/* )} */}
                </Button>
              ))}
            </div>
          </div>
          
          {loadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-20 ${themeClasses.muted} animate-pulse rounded-lg`} />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className={`text-xl font-semibold ${themeClasses.foreground} mb-2`}>
                {activityFilter === 'all' ? 'No activity yet' : `No ${activityFilter} activity`}
              </h3>
              <p className={themeClasses.mutedForeground}>
                {activityFilter === 'all' 
                  ? 'Activity will appear here as people interact with your poems.'
                  : `${activityFilter.charAt(0).toUpperCase() + activityFilter.slice(1)} activity will appear here.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.slice(0, 50).map((activity) => (
                <Card key={activity.id} isDarkMode={theme === 'dark'} className="hover:shadow-sm transition-shadow">
                  <Card.Header>
                  </Card.Header>
                  
                  <Card.Content className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${themeClasses.foreground} `}>
                          {getActivityDescription(activity)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${themeClasses.mutedForeground}`}>
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                          {/* <span className="text-lg">{getActivityIcon(activity.type)}</span> */}
                          <Button
                            variant="outline"
                            size="sm"
                            corners="rounded"
                            isDarkMode={theme === 'dark'}
                            className="px-2 py-1 text-xs pointer-events-none"
                          >
                            {activity.type.replace('_', ' ')}
                          </Button>
                        </div>
                      </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
