export interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  pinnedPoems: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Poem {
  id: string;
  title: string;
  content: string; // Rich text content from Tiptap
  authorId: string;
  published: boolean;
  pinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Draft {
  id: string;
  authorId: string;
  title: string;
  content: string; // Rich text content from Tiptap
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  poemId: string;
  authorId: string | null;      // User ID (null for anonymous)
  authorName: string;           // Display name or "Anonymous" 
  authorEmail: string | null;   // For anonymous users who want replies
  content: string;
  parentId: string | null;      // null for top-level, commentId for replies
  threadPath: string;           // For efficient nested queries (e.g., "commentId1/commentId2")
  depth: number;                // 0 for top-level, 1 for first reply, etc.
  likeCount: number;            // Total likes
  replyCount: number;           // Direct replies count
  isReported: boolean;          // If comment has been reported
  reportCount: number;          // Number of reports
  isDeleted: boolean;           // Soft delete flag
  
  // Bot protection
  sessionId: string;            // Browser session identifier
  ipAddress: string | null;     // For rate limiting (hashed for privacy)
  botCheckPassed: boolean;      // Whether bot check was completed
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  poemId: string;
  userId: string;
  createdAt: Date;
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string | null;        // User ID (null for anonymous)
  sessionId: string | null;     // For anonymous users
  createdAt: Date;
}

export interface CommentReport {
  id: string;
  commentId: string;
  poemId: string;
  reporterId: string | null;    // User who reported (null for anonymous)
  reporterSessionId: string | null; // For anonymous reporters
  reason: string;               // Report reason (spam, harassment, etc.)
  description: string;          // Optional description
  status: 'pending' | 'reviewed' | 'dismissed'; // Report status
  createdAt: Date;
}

export interface BotCheck {
  sessionId: string;
  challengeType: 'simple-math' | 'captcha' | 'honeypot';
  challengeData: { question: string } | string | number | Record<string, unknown>; // Challenge-specific data
  solution: string;             // Expected answer
  attempts: number;             // Number of attempts made
  passed: boolean;              // Whether check was passed
  expiresAt: Date | import('firebase/firestore').Timestamp; // When this check expires
  createdAt: Date;
}

export interface EmailSubscriber {
  id: string;
  email: string;
  subscribed: boolean;
  createdAt: Date;
}