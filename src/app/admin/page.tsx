'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button, Card } from '@mond-design-system/theme';
import { getActivity, getPoems, Activity } from '@/lib/firebaseService';
import { Poem } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import mockPoemsData from '@/data/mock-poems.json';

// Removed unused User interface - using inline type

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'comments' | 'poems' | 'reports'>('all');
  const [realPoems, setRealPoems] = useState<Poem[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      }
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    // Load activity data and real poems
    const loadData = async () => {
      try {
        const [activityData, poemsData] = await Promise.all([
          getActivity(50), // Get last 50 activities
          getPoems(false) // Get all poems including drafts
        ]);
        setActivities(activityData);
        setRealPoems(poemsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    if (currentUser && currentUser.isAdmin) {
      loadData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
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

  // Format activity for display
  const formatActivity = (activity: Activity) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'comment_added': return '💬';
        case 'comment_liked': return '❤️';
        case 'comment_replied': return '↩️';
        case 'comment_reported': return '⚠️';
        case 'comment_deleted': return '🗑️';
        case 'poem_created': return '✏️';
        case 'poem_published': return '📖';
        case 'poem_liked': return '❤️';
        case 'subscriber_joined': return '📧';
        default: return '•';
      }
    };

    const getDescription = () => {
      const metadata = activity.metadata || {};
      const userName = activity.userId === 'anonymous' ? 'Anonymous user' : 'User';
      
      switch (activity.type) {
        case 'comment_added':
          return `${userName} commented on "${metadata.title}"`;
        case 'comment_liked':
          return `${userName} liked a comment`;
        case 'comment_replied':
          return `${userName} replied to a comment on "${metadata.title}"`;
        case 'comment_reported':
          return `${userName} reported a comment on "${metadata.title}"`;
        case 'comment_deleted':
          return `Admin deleted a comment by ${metadata.originalAuthor} on "${metadata.title}"`;
        case 'poem_created':
          return `${userName} created "${metadata.title}"`;
        case 'poem_published':
          return `${userName} published "${metadata.title}"`;
        case 'poem_liked':
          return `${userName} liked "${metadata.title}"`;
        case 'subscriber_joined':
          return `New subscriber: ${metadata.email}`;
        default:
          return `${activity.type} activity`;
      }
    };

    const getColor = () => {
      switch (activity.type) {
        case 'comment_reported':
          return 'bg-red-500';
        case 'comment_deleted':
          return 'bg-red-400';
        case 'poem_published':
        case 'comment_added':
          return 'bg-primary';
        case 'comment_liked':
        case 'poem_liked':
          return 'bg-pink-500';
        default:
          return 'bg-primary/60';
      }
    };

    return {
      icon: getIcon(),
      description: getDescription(),
      color: getColor(),
      time: formatRelativeTime(activity.timestamp)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Will redirect
  }

  // Use real poems if available, fallback to mock data
  const poemsToUse = realPoems.length > 0 ? realPoems : mockPoemsData;
  const totalPoems = poemsToUse.length;
  const publishedPoems = poemsToUse.filter(p => p.published).length;
  const pinnedPoems = poemsToUse.filter(p => p.pinned).length;
  const totalLikes = poemsToUse.reduce((sum, p) => sum + (p.likeCount || 0), 0);

  // Count comment-related activities
  const commentActivities = activities.filter(a => 
    ['comment_added', 'comment_liked', 'comment_replied', 'comment_reported', 'comment_deleted'].includes(a.type)
  ).length;

  // Count reported comments
  const reportedComments = activities.filter(a => a.type === 'comment_reported').length;

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
              Admin Dashboard
            </h1>
            <p className={themeClasses.mutedForeground}>
              Welcome back, {currentUser.displayName}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" isDarkMode={theme === 'dark'}>
                ← Back to Site
              </Button>
            </Link>
            <Button
              variant="outline"
              isDarkMode={theme === 'dark'}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <p className={`text-sm font-medium ${themeClasses.mutedForeground}`}>Total Poems</p>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.foreground}`}>{totalPoems}</p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </Card.Content>
          </Card>

          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <p className={`text-sm font-medium ${themeClasses.mutedForeground}`}>Published</p>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.foreground}`}>{publishedPoems}</p>
                </div>
                <div className="text-2xl">📖</div>
              </div>
            </Card.Content>
          </Card>

          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <p className={`text-sm font-medium ${themeClasses.mutedForeground}`}>Pinned</p>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.foreground}`}>{pinnedPoems}</p>
                </div>
                <div className="text-2xl">📌</div>
              </div>
            </Card.Content>
          </Card>

          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <p className={`text-sm font-medium ${themeClasses.mutedForeground}`}>Total Likes</p>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.foreground}`}>{totalLikes}</p>
                </div>
                <div className="text-2xl">❤️</div>
              </div>
            </Card.Content>
          </Card>

          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <p className={`text-sm font-medium ${themeClasses.mutedForeground}`}>Comment Activity</p>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.foreground}`}>{commentActivities}</p>
                  {reportedComments > 0 && (
                    <p className="text-xs text-red-500">{reportedComments} reports</p>
                  )}
                </div>
                <div className="text-2xl">💬</div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>Quick Actions</h2>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Link href="/create">
                  <Button 
                    variant="primary" 
                    isDarkMode={theme === 'dark'}
                    className="w-full justify-start"
                  >
                    ✏️ Create New Poem
                  </Button>
                </Link>
                
                <Link href="/admin/poems">
                  <Button 
                    variant="outline" 
                    isDarkMode={theme === 'dark'}
                    className="w-full justify-start"
                  >
                    📚 Manage Poems
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  isDarkMode={theme === 'dark'}
                  className="w-full justify-start"
                  disabled
                >
                  📊 View Analytics (Coming Soon)
                </Button>
                
                <Link href="/admin/subscribers">
                  <Button 
                    variant="outline" 
                    isDarkMode={theme === 'dark'}
                    className="w-full justify-start"
                  >
                    📧 Manage Subscribers
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>

          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>Recent Activity</h2>
                <Link href="/activity">
                  <Button variant="ghost" size="sm" isDarkMode={theme === 'dark'}>
                    View All →
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Activity Filter */}
                <div className="flex flex-wrap gap-2">
                  {['all', 'comments', 'poems', 'reports'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter as 'all' | 'comments' | 'poems' | 'reports')}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        activityFilter === filter
                          ? 'bg-primary text-white shadow-md'
                          : `${themeClasses.muted} ${themeClasses.mutedForeground} hover:${themeClasses.foreground} hover:bg-primary/10 border ${themeClasses.border}`
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredActivities.length === 0 ? (
                  <div className={`text-center py-4 ${themeClasses.mutedForeground}`}>
                    No activity found for the selected filter.
                  </div>
                ) : (
                  filteredActivities.slice(0, 10).map((activity) => {
                    const formatted = formatActivity(activity);
                    return (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className={`w-2 h-2 ${formatted.color} rounded-full mt-2 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className={`${themeClasses.foreground} flex items-center gap-2`}>
                            <span>{formatted.icon}</span>
                            <span className="truncate">{formatted.description}</span>
                          </div>
                          <div className={`text-xs ${themeClasses.mutedForeground} mt-1`}>
                            {formatted.time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {filteredActivities.length > 10 && (
                  <div className={`text-center pt-2 border-t ${themeClasses.border}`}>
                    <span className={`text-xs ${themeClasses.mutedForeground}`}>
                      +{filteredActivities.length - 10} more activities
                    </span>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Recent Poems Preview */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>Recent Poems</h2>
            <Link href="/">
              <Button variant="ghost" isDarkMode={theme === 'dark'}>
                View All →
              </Button>
            </Link>
          </div>
          
          <Card isDarkMode={theme === 'dark'}>
            <Card.Header>
              <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>Recent Poems</h2>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {poemsToUse.slice(0, 5).map((poem) => (
                  <div key={poem.id} className={`flex items-center justify-between py-2 border-b ${themeClasses.border} last:border-b-0`}>
                    <div>
                      <h3 className={`font-medium ${themeClasses.foreground}`}>{poem.title}</h3>
                      <p className={`text-sm ${themeClasses.mutedForeground}`}>
                        {new Date(poem.createdAt).toLocaleDateString()} • {poem.likeCount || 0} likes • {poem.commentCount || 0} comments
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {poem.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Pinned</span>}
                      <span className={`text-xs px-2 py-1 rounded ${
                        poem.published 
                          ? 'bg-primary/10 text-primary' 
                          : `${themeClasses.muted} ${themeClasses.mutedForeground}`
                      }`}>
                        {poem.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}