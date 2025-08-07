import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Local storage helpers for likes tracking
export function getLikedPoems(): string[] {
  if (typeof window === 'undefined') return [];
  const liked = localStorage.getItem('likedPoems');
  return liked ? JSON.parse(liked) : [];
}

export function addLikedPoem(poemId: string): void {
  if (typeof window === 'undefined') return;
  const liked = getLikedPoems();
  if (!liked.includes(poemId)) {
    liked.push(poemId);
    localStorage.setItem('likedPoems', JSON.stringify(liked));
  }
}

export function removeLikedPoem(poemId: string): void {
  if (typeof window === 'undefined') return;
  const liked = getLikedPoems();
  const filtered = liked.filter(id => id !== poemId);
  localStorage.setItem('likedPoems', JSON.stringify(filtered));
}

export function isLikedPoem(poemId: string): boolean {
  return getLikedPoems().includes(poemId);
}