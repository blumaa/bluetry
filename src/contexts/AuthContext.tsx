'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock authentication first
    const checkMockAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      
      if (isAuthenticated && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setLoading(false);
          return true;
        } catch {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
        }
      }
      return false;
    };

    // Try mock auth first
    if (checkMockAuth()) {
      return;
    }

    // Fallback to Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || userData.displayName || '',
            isAdmin: userData.isAdmin || false,
            pinnedPoems: userData.pinnedPoems || [],
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        } else {
          // Create user document if it doesn't exist
          const newUser: Omit<User, 'id'> = {
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || '',
            isAdmin: false,
            pinnedPoems: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await setDoc(userDocRef, newUser);
          setCurrentUser({ id: user.uid, ...newUser });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // Clear mock auth
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Clear Firebase auth if exists
    if (firebaseUser) {
      await signOut(auth);
    }
    
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}