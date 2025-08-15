import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Poem, Comment, CommentReport, BotCheck } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// ==================== POEMS ====================

export interface PoemData {
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  pinned: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export async function getPoems(publishedOnly: boolean = true): Promise<Poem[]> {
  try {
    let q;
    if (publishedOnly) {
      // Simple query to avoid index requirements  
      q = query(
        collection(db, 'poems'),
        where('published', '==', true)
      );
    } else {
      q = query(collection(db, 'poems'));
    }
    
    const querySnapshot = await getDocs(q);
    const poems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Poem[];
    
    // Sort in memory by createdAt (most recent first)
    poems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return poems;
  } catch (error) {
    console.error('Error fetching poems:', error);
    return [];
  }
}

export async function getPinnedPoems(): Promise<Poem[]> {
  try {
    // Simple query to avoid composite index requirements
    const q = query(
      collection(db, 'poems'),
      where('published', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const allPoems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Poem[];
    
    // Filter for pinned poems and sort in memory
    const poems = allPoems
      .filter(poem => poem.pinned === true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return poems;
  } catch (error) {
    console.error('Error fetching pinned poems:', error);
    return [];
  }
}

export async function getPoemById(id: string): Promise<Poem | null> {
  try {
    const docRef = doc(db, 'poems', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Poem;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching poem:', error);
    return null;
  }
}

export async function createPoem(poemData: Omit<PoemData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'poems'), {
      ...poemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Log activity
    await logActivity('poem_created', poemData.authorId, docRef.id, { title: poemData.title });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating poem:', error);
    throw error;
  }
}

export async function updatePoem(id: string, updates: Partial<PoemData>): Promise<void> {
  try {
    const docRef = doc(db, 'poems', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    // Log activity if poem was published
    if (updates.published === true) {
      const poemData = await getPoemById(id);
      if (poemData) {
        await logActivity('poem_published', poemData.authorId, id, { title: poemData.title });
      }
    }
  } catch (error) {
    console.error('Error updating poem:', error);
    throw error;
  }
}

export async function deletePoem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'poems', id));
  } catch (error) {
    console.error('Error deleting poem:', error);
    throw error;
  }
}

export async function togglePinPoem(id: string, pinned: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'poems', id);
    await updateDoc(docRef, {
      pinned: pinned,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    throw error;
  }
}

// ==================== DRAFTS ====================

export async function getDrafts(authorId?: string): Promise<Poem[]> {
  try {
    // Simplify query to avoid index requirements
    const q = query(
      collection(db, 'poems'),
      where('published', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    let drafts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Poem[];
    
    // Filter by authorId in memory if provided
    if (authorId) {
      drafts = drafts.filter(poem => poem.authorId === authorId);
    }
    
    // Sort in memory by updatedAt (most recent first)
    drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return drafts;
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }
}

// ==================== LIKES ====================

export interface LikeData {
  userId: string;
  poemId: string;
  createdAt?: Date | Timestamp;
}

export async function likePoem(userId: string, poemId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Add like document
    const likeRef = doc(collection(db, 'likes'));
    batch.set(likeRef, {
      userId,
      poemId,
      createdAt: serverTimestamp(),
    });
    
    // Increment poem like count
    const poemRef = doc(db, 'poems', poemId);
    batch.update(poemRef, {
      likeCount: increment(1),
    });
    
    await batch.commit();
    
    // Log activity - get poem title for the activity
    const poem = await getPoemById(poemId);
    if (poem) {
      await logActivity('poem_liked', userId, poemId, { title: poem.title });
    }
  } catch (error) {
    console.error('Error liking poem:', error);
    throw error;
  }
}

export async function unlikePoem(userId: string, poemId: string): Promise<void> {
  try {
    // Find and delete the like document
    const q = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('poemId', '==', poemId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      
      // Delete like document
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Decrement poem like count
      const poemRef = doc(db, 'poems', poemId);
      batch.update(poemRef, {
        likeCount: increment(-1),
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Error unliking poem:', error);
    throw error;
  }
}

export async function getUserLikedPoems(userId: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'likes'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().poemId);
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return [];
  }
}

export async function isPoemLikedByUser(userId: string, poemId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('poemId', '==', poemId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if poem is liked:', error);
    return false;
  }
}

// ==================== COMMENTS ====================

// Bot check functions
export async function createBotCheck(sessionId: string): Promise<BotCheck & { id: string }> {
  try {
    // Generate simple math challenge
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const solution = (a + b).toString();
    
    const botCheck: Omit<BotCheck, 'id'> = {
      sessionId,
      challengeType: 'simple-math',
      challengeData: { question: `${a} + ${b} = ?` },
      solution,
      attempts: 0,
      passed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'botChecks'), {
      ...botCheck,
      createdAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...botCheck };
  } catch (error) {
    console.error('Error creating bot check:', error);
    throw error;
  }
}

export async function validateBotCheck(sessionId: string, answer: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'botChecks'),
      where('sessionId', '==', sessionId),
      where('passed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const botCheckDoc = querySnapshot.docs[0];
    const botCheck = botCheckDoc.data() as BotCheck;
    
    // Check if expired
    const now = new Date();
    const expiryDate = botCheck.expiresAt instanceof Date ? botCheck.expiresAt : botCheck.expiresAt.toDate();
    
    if (now > expiryDate) {
      return false;
    }
    
    // Increment attempts
    await updateDoc(botCheckDoc.ref, {
      attempts: increment(1)
    });
    
    if (answer === botCheck.solution) {
      await updateDoc(botCheckDoc.ref, {
        passed: true
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating bot check:', error);
    return false;
  }
}

export async function addComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // Validate bot check for anonymous users
    if (!commentData.authorId && !commentData.botCheckPassed) {
      throw new Error('Bot check required for anonymous comments');
    }
    
    // For anonymous users, ensure sessionId exists and botCheckPassed is true
    if (!commentData.authorId) {
      if (!commentData.sessionId) {
        throw new Error('Session ID required for anonymous comments');
      }
      if (!commentData.botCheckPassed) {
        throw new Error('Bot check must be passed for anonymous comments');
      }
    }
    
    const now = serverTimestamp();
    
    // Add comment first
    const commentRef = await addDoc(collection(db, 'comments'), {
      ...commentData,
      createdAt: now,
      updatedAt: now,
    });
    
    // Then update counts in separate operations
    try {
      const poemRef = doc(db, 'poems', commentData.poemId);
      await updateDoc(poemRef, {
        commentCount: increment(1),
      });
    } catch (error) {
      console.error('Error updating poem comment count:', error);
    }
    
    // If this is a reply, increment parent's reply count (only for authenticated users)
    if (commentData.parentId && commentData.authorId) {
      try {
        const parentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentRef, {
          replyCount: increment(1),
        });
      } catch (error) {
        console.error('Error updating parent reply count:', error);
      }
    }
    
    // Log activity for authenticated users only
    if (commentData.authorId) {
      try {
        const poem = await getPoemById(commentData.poemId);
        if (poem) {
          const activityType = commentData.parentId ? 'comment_replied' : 'comment_added';
          await logActivity(activityType, commentData.authorId, commentData.poemId, { 
            title: poem.title,
            commentId: commentRef.id,
            parentId: commentData.parentId 
          });
        }
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }
    
    return commentRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function getComments(poemId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('poemId', '==', poemId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// ==================== SUBSCRIBERS ====================

export async function addSubscriber(email: string): Promise<void> {
  try {
    // Check if email already exists
    const q = query(collection(db, 'subscribers'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('Email already subscribed');
    }
    
    await addDoc(collection(db, 'subscribers'), {
      email: email.toLowerCase(),
      subscribed: true,
      createdAt: serverTimestamp(),
    });
    
    // Log activity
    await logActivity('subscriber_joined', 'system', null, { email });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    throw error;
  }
}

export async function getSubscribers(): Promise<Array<{ id: string; email: string; subscribed: boolean; createdAt: Date }>> {
  try {
    // Remove orderBy to avoid issues with mixed timestamp formats
    const q = query(collection(db, 'subscribers'));
    const querySnapshot = await getDocs(q);
    
    const subscribers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        subscribed: data.subscribed ?? true, // Default to true if not set
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
      };
    });
    
    // Sort in memory by createdAt (most recent first)
    subscribers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return subscribers;
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
}

export async function updateSubscriber(subscriberId: string, updates: { email?: string; subscribed?: boolean }): Promise<void> {
  try {
    const subscriberRef = doc(db, 'subscribers', subscriberId);
    await updateDoc(subscriberRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    throw error;
  }
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
  try {
    const subscriberRef = doc(db, 'subscribers', subscriberId);
    await deleteDoc(subscriberRef);
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    throw error;
  }
}

export async function sendEmailToAllSubscribers(subject: string, message: string): Promise<{ sent: number; failed: number }> {
  try {
    // First get all active subscribers from the client side
    const allSubscribers = await getSubscribers();
    const activeSubscribers = allSubscribers.filter(sub => sub.subscribed);

    if (activeSubscribers.length === 0) {
      throw new Error('No active subscribers found');
    }

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        subject, 
        message, 
        subscribers: activeSubscribers 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Log activity for successful sends
    if (result.sent > 0) {
      await logActivity('subscriber_email_sent', 'admin', null, { 
        subject, 
        message, 
        sent: result.sent, 
        failed: result.failed 
      });
    }

    return { sent: result.sent, failed: result.failed };
  } catch (error) {
    console.error('Error sending email to subscribers:', error);
    throw error;
  }
}

// ==================== ACTIVITY ====================

export interface ActivityData {
  type: 'poem_created' | 'poem_published' | 'poem_liked' | 'comment_added' | 'comment_liked' | 'comment_replied' | 'comment_reported' | 'comment_deleted' | 'subscriber_joined' | 'subscriber_email_sent';
  userId: string;
  poemId?: string | null;
  commentId?: string | null;    // For comment-related activities
  metadata?: Record<string, unknown>;
  timestamp?: Date | Timestamp;
}

export interface Activity extends ActivityData {
  id: string;
  timestamp: Date;
}

export async function logActivity(
  type: ActivityData['type'], 
  userId: string, 
  poemId?: string | null, 
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await addDoc(collection(db, 'activity'), {
      type,
      userId,
      poemId: poemId || null,
      metadata: metadata || {},
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging shouldn't break main functionality
  }
}

export async function getActivity(limit_count: number = 50): Promise<Activity[]> {
  try {
    const q = query(
      collection(db, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Activity[];
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
}

// ==================== USERS ====================

export async function createUser(uid: string, userData: {
  email: string;
  displayName: string;
  isAdmin?: boolean;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...userData,
      isAdmin: userData.isAdmin || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUser(uid: string) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// ==================== REAL-TIME LISTENERS ====================

export function listenToPoems(callback: (poems: Poem[]) => void, publishedOnly: boolean = true): Unsubscribe {
  let q;
  if (publishedOnly) {
    // Simple query to avoid index requirements
    q = query(
      collection(db, 'poems'),
      where('published', '==', true)
    );
  } else {
    q = query(collection(db, 'poems'));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const poems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Poem[];
    
    // Sort in memory by createdAt (most recent first)
    poems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    callback(poems);
  });
}

export function listenToComments(poemId: string, callback: (comments: Comment[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'comments'),
    where('poemId', '==', poemId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const comments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Comment[];
    
    callback(comments);
  });
}

// ==================== COMMENT LIKES ====================

export async function likeComment(commentId: string, userId: string | null, sessionId: string | null): Promise<void> {
  try {
    // Simulate successful like - UI handles optimistic updates
    return Promise.resolve();
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
}

export async function unlikeComment(commentId: string, userId: string | null, sessionId: string | null): Promise<void> {
  try {
    // For now, just log the unlike locally to avoid Firebase permission issues  
    // The UI will handle optimistic updates
    
    // Simulate successful unlike - no actual Firebase write needed for now
    return Promise.resolve();
  } catch (error) {
    console.error('Error unliking comment:', error);
    throw error;
  }
}

export async function isCommentLikedByUser(commentId: string, userId: string | null, sessionId: string | null): Promise<boolean> {
  try {
    // For now, return false to avoid Firebase permission issues
    // The UI will manage like state locally through optimistic updates
    return false;
  } catch (error) {
    console.error('Error checking comment like status:', error);
    return false;
  }
}

// ==================== COMMENT REPORTS ====================

export async function reportComment(reportData: Omit<CommentReport, 'id' | 'createdAt'>): Promise<string> {
  try {
    // Add report record first
    const reportRef = await addDoc(collection(db, 'commentReports'), {
      ...reportData,
      createdAt: serverTimestamp(),
    });

    // Try to update comment to mark as reported (may fail for anonymous users)
    try {
      const commentRef = doc(db, 'comments', reportData.commentId);
      await updateDoc(commentRef, {
        isReported: true,
        reportCount: increment(1),
      });
    } catch (error) {
      // Silently ignore permission errors - the report record was still created
      // This is expected for anonymous users who can't update comment fields
    }

    // Log activity for authenticated users only
    if (reportData.reporterId) {
      try {
        await logActivity('comment_reported', reportData.reporterId, reportData.poemId, { 
          commentId: reportData.commentId,
          reason: reportData.reason
        });
      } catch (error) {
        // Ignore activity logging errors
      }
    }

    return reportRef.id;
  } catch (error) {
    console.error('Error reporting comment:', error);
    throw error;
  }
}

export async function deleteComment(commentId: string, adminId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get comment data before deletion for activity logging
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as Comment;

    // Soft delete - mark as deleted instead of actually removing
    batch.update(commentRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: adminId,
      updatedAt: serverTimestamp(),
    });

    // Decrement poem comment count
    const poemRef = doc(db, 'poems', commentData.poemId);
    batch.update(poemRef, {
      commentCount: increment(-1),
    });

    // If this was a reply, decrement parent's reply count
    if (commentData.parentId) {
      const parentRef = doc(db, 'comments', commentData.parentId);
      batch.update(parentRef, {
        replyCount: increment(-1),
      });
    }

    await batch.commit();

    // Log activity
    const poem = await getPoemById(commentData.poemId);
    if (poem) {
      await logActivity('comment_deleted', adminId, commentData.poemId, { 
        commentId,
        title: poem.title,
        originalAuthor: commentData.authorName
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}