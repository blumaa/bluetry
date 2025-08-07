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
  userId: string;
  content: string;
  parentId?: string; // For nested replies
  createdAt: Date;
  // User info for display
  userDisplayName: string;
  userEmail: string;
}

export interface Like {
  id: string;
  poemId: string;
  userId: string;
  createdAt: Date;
}

export interface EmailSubscriber {
  id: string;
  email: string;
  subscribed: boolean;
  createdAt: Date;
}