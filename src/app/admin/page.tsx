'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@mond-design-system/theme';
import mockPoemsData from '@/data/mock-poems.json';

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');

    if (isAuthenticated && userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const totalPoems = mockPoemsData.length;
  const publishedPoems = mockPoemsData.filter(p => p.published).length;
  const pinnedPoems = mockPoemsData.filter(p => p.pinned).length;
  const totalLikes = mockPoemsData.reduce((sum, p) => sum + p.likeCount, 0);
  const totalComments = mockPoemsData.reduce((sum, p) => sum + p.commentCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.displayName}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Poems</p>
                <p className="text-2xl font-bold text-foreground">{totalPoems}</p>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-foreground">{publishedPoems}</p>
              </div>
              <div className="text-2xl">📖</div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pinned</p>
                <p className="text-2xl font-bold text-foreground">{pinnedPoems}</p>
              </div>
              <div className="text-2xl">📌</div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
              </div>
              <div className="text-2xl">❤️</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
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
              
              <Button 
                variant="outline" 
                isDarkMode={theme === 'dark'}
                className="w-full justify-start"
                disabled
              >
                📧 Manage Subscribers (Coming Soon)
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Total engagement: {totalComments} comments</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Most liked poem: "Diary of a Programmer 49"</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-muted-foreground">Latest poem: "Thanks for Caring About Me"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Poems Preview */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Poems</h2>
            <Link href="/">
              <Button variant="ghost" isDarkMode={theme === 'dark'}>
                View All →
              </Button>
            </Link>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              {mockPoemsData.slice(0, 5).map((poem) => (
                <div key={poem.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div>
                    <h3 className="font-medium text-foreground">{poem.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(poem.createdAt).toLocaleDateString()} • {poem.likeCount} likes • {poem.commentCount} comments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {poem.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Pinned</span>}
                    <span className={`text-xs px-2 py-1 rounded ${
                      poem.published 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {poem.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}