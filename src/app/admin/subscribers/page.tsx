'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card, Input } from '@mond-design-system/theme';
import { formatRelativeTime } from '@/lib/utils';
import { getSubscribers, deleteSubscriber, updateSubscriber, sendEmailToAllSubscribers } from '@/lib/firebaseService';

interface Subscriber {
  id: string;
  email: string;
  subscribed: boolean;
  createdAt: Date;
}

export default function SubscribersPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { currentUser, loading } = useAuth();
  const { success, error } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [updatingSubscriber, setUpdatingSubscriber] = useState<string | null>(null);
  const [deletingSubscriber, setDeletingSubscriber] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!currentUser.isAdmin) {
        router.push('/');
      } else {
        loadSubscribers();
      }
    }
  }, [currentUser, loading, router]);

  const loadSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const subscribersData = await getSubscribers();
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (deletingSubscriber) return;

    try {
      setDeletingSubscriber(subscriberId);
      await deleteSubscriber(subscriberId);
      setSubscribers(subscribers.filter(sub => sub.id !== subscriberId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    } finally {
      setDeletingSubscriber(null);
    }
  };

  const handleUpdateEmail = async (subscriberId: string, newEmail: string) => {
    if (updatingSubscriber) return;

    try {
      setUpdatingSubscriber(subscriberId);
      await updateSubscriber(subscriberId, { email: newEmail });
      setSubscribers(subscribers.map(sub => 
        sub.id === subscriberId ? { ...sub, email: newEmail } : sub
      ));
      setEditingEmail(null);
      setEditEmailValue('');
    } catch (error) {
      console.error('Error updating subscriber email:', error);
    } finally {
      setUpdatingSubscriber(null);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingEmail || !emailSubject.trim() || !emailMessage.trim()) return;

    try {
      setSendingEmail(true);
      const result = await sendEmailToAllSubscribers(emailSubject.trim(), emailMessage.trim());
      setEmailSubject('');
      setEmailMessage('');
      setShowEmailForm(false);
      
      if (result.failed > 0) {
        error(`Email sent to ${result.sent} subscribers, but ${result.failed} failed to send.`);
      } else {
        success(`Email successfully sent to ${result.sent} subscribers!`);
      }
    } catch (errorObj) {
      console.error('Error sending email:', errorObj);
      const errorMessage = errorObj instanceof Error ? errorObj.message : 'Failed to send email. Please try again.';
      error(errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  const startEditingEmail = (subscriber: Subscriber) => {
    setEditingEmail(subscriber.id);
    setEditEmailValue(subscriber.email);
  };

  const cancelEditingEmail = () => {
    setEditingEmail(null);
    setEditEmailValue('');
  };

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Will redirect
  }

  const activeSubscribers = subscribers.filter(sub => sub.subscribed);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${themeClasses.foreground} mb-2`}>
            Subscribers
          </h1>
          <p className={themeClasses.mutedForeground}>
            Manage email subscribers and send newsletters
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" isDarkMode={theme === 'dark'}>
              ← Admin Dashboard
            </Button>
          </Link>
          <Button 
            variant="primary" 
            isDarkMode={theme === 'dark'}
            onClick={() => setShowEmailForm(!showEmailForm)}
          >
            {showEmailForm ? 'Cancel' : '✉️ Email All Subscribers'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card isDarkMode={theme === 'dark'}>
          <Card.Header>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Total Subscribers</div>
          </Card.Header>
          <Card.Content className="p-4">
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {subscribers.length}
            </div>
          </Card.Content>
        </Card>

        <Card isDarkMode={theme === 'dark'}>
          <Card.Header>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Active Subscribers</div>
          </Card.Header>
          <Card.Content className="p-4">
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {activeSubscribers.length}
            </div>
          </Card.Content>
        </Card>

        <Card isDarkMode={theme === 'dark'}>
          <Card.Header>
            <div className={`text-sm ${themeClasses.mutedForeground}`}>Unsubscribed</div>
          </Card.Header>
          <Card.Content className="p-4">
            <div className={`text-2xl font-bold ${themeClasses.foreground}`}>
              {subscribers.length - activeSubscribers.length}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Email All Subscribers Form */}
      {showEmailForm && (
        <Card isDarkMode={theme === 'dark'} className="mb-8">
          <Card.Header>
            <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>
              Send Email to All Subscribers
            </h2>
          </Card.Header>
          <Card.Content className="p-6">
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label htmlFor="email-subject" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
                  Subject *
                </label>
                <Input
                  id="email-subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  disabled={sendingEmail}
                  required
                  isDarkMode={theme === 'dark'}
                />
              </div>

              <div>
                <label htmlFor="email-message" className={`block text-sm font-medium ${themeClasses.foreground} mb-2`}>
                  Message *
                </label>
                <textarea
                  id="email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.background} ${themeClasses.foreground} placeholder:${themeClasses.mutedForeground} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none`}
                  placeholder="Enter your message..."
                  rows={6}
                  disabled={sendingEmail}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  isDarkMode={theme === 'dark'}
                  onClick={() => setShowEmailForm(false)}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isDarkMode={theme === 'dark'}
                  disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                >
                  {sendingEmail ? 'Sending...' : `Send to ${activeSubscribers.length} Subscribers`}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}

      {/* Subscribers List */}
      <Card isDarkMode={theme === 'dark'}>
        <Card.Header>
          <h2 className={`text-xl font-semibold ${themeClasses.foreground}`}>
            All Subscribers
          </h2>
        </Card.Header>
        <Card.Content className="p-6">
          {loadingSubscribers ? (
            <div className={`text-center py-8 ${themeClasses.mutedForeground}`}>
              Loading subscribers...
            </div>
          ) : subscribers.length === 0 ? (
            <div className={`text-center py-8 ${themeClasses.mutedForeground}`}>
              <div className="text-4xl mb-4">📧</div>
              <h3 className={`text-xl font-semibold ${themeClasses.foreground} mb-2`}>
                No subscribers yet
              </h3>
              <p>Subscribers will appear here when they sign up for your newsletter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className={`flex items-center justify-between p-4 border ${themeClasses.border} rounded-lg`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${subscriber.subscribed ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      {editingEmail === subscriber.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="email"
                            value={editEmailValue}
                            onChange={(e) => setEditEmailValue(e.target.value)}
                            placeholder="Enter email"
                            disabled={updatingSubscriber === subscriber.id}
                            isDarkMode={theme === 'dark'}
                            className="flex-1"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            isDarkMode={theme === 'dark'}
                            onClick={() => handleUpdateEmail(subscriber.id, editEmailValue)}
                            disabled={updatingSubscriber === subscriber.id || !editEmailValue.trim()}
                          >
                            {updatingSubscriber === subscriber.id ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            isDarkMode={theme === 'dark'}
                            onClick={cancelEditingEmail}
                            disabled={updatingSubscriber === subscriber.id}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className={`font-medium ${themeClasses.foreground}`}>
                            {subscriber.email}
                          </p>
                          <p className={`text-sm ${themeClasses.mutedForeground}`}>
                            Joined {formatRelativeTime(subscriber.createdAt)}
                            {!subscriber.subscribed && ' • Unsubscribed'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {editingEmail !== subscriber.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        isDarkMode={theme === 'dark'}
                        onClick={() => startEditingEmail(subscriber)}
                        disabled={updatingSubscriber === subscriber.id}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isDarkMode={theme === 'dark'}
                        onClick={() => setConfirmDeleteId(subscriber.id)}
                        disabled={deletingSubscriber === subscriber.id}
                        className={`${themeClasses.mutedForeground} hover:text-red-600`}
                      >
                        {deletingSubscriber === subscriber.id ? 'Deleting...' : '🗑️ Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className={`fixed inset-0 ${themeClasses.background}/80 backdrop-blur-sm flex items-center justify-center z-50`}>
          <Card isDarkMode={theme === 'dark'} className="max-w-md w-full mx-4">
            <Card.Header>
              <h3 className={`text-lg font-semibold ${themeClasses.foreground}`}>
                Confirm Delete
              </h3>
            </Card.Header>
            <Card.Content className="p-6">
              <p className={`${themeClasses.mutedForeground} mb-6`}>
                Are you sure you want to delete this subscriber? This action cannot be undone.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  isDarkMode={theme === 'dark'}
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingSubscriber === confirmDeleteId}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isDarkMode={theme === 'dark'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDeleteSubscriber(confirmDeleteId)}
                  disabled={deletingSubscriber === confirmDeleteId}
                >
                  {deletingSubscriber === confirmDeleteId ? 'Deleting...' : 'Delete Subscriber'}
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}