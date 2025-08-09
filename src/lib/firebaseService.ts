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
import { Poem } from '@/types';

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
  createdAt?: any;
  updatedAt?: any;
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
  createdAt?: any;
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

export interface CommentData {
  poemId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Comment extends CommentData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function addComment(commentData: Omit<CommentData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const batch = writeBatch(db);
    
    // Add comment
    const commentRef = doc(collection(db, 'comments'));
    batch.set(commentRef, {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Increment poem comment count
    const poemRef = doc(db, 'poems', commentData.poemId);
    batch.update(poemRef, {
      commentCount: increment(1),
    });
    
    await batch.commit();
    
    // Log activity - get poem title for the activity
    const poem = await getPoemById(commentData.poemId);
    if (poem) {
      await logActivity('comment_added', commentData.authorId, commentData.poemId, { title: poem.title });
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
    const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      subscribed: doc.data().subscribed,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
}

// ==================== ACTIVITY ====================

export interface ActivityData {
  type: 'poem_created' | 'poem_published' | 'poem_liked' | 'comment_added' | 'subscriber_joined';
  userId: string;
  poemId?: string | null;
  metadata?: any;
  timestamp?: any;
}

export interface Activity extends ActivityData {
  id: string;
  timestamp: Date;
}

export async function logActivity(
  type: ActivityData['type'], 
  userId: string, 
  poemId?: string | null, 
  metadata?: any
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