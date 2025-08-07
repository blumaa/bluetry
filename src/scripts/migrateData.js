// Run this script to migrate mock data to Firestore
// Usage: node src/scripts/migrateData.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import mockPoemsData from '../data/mock-poems.json' assert { type: 'json' };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePoems() {
  console.log('Starting poem migration...');
  console.log(`Found ${mockPoemsData.length} poems to migrate`);
  
  // Test with just the first poem
  const firstPoem = mockPoemsData[0];
  
  try {
    console.log(`Testing with first poem: ${firstPoem.title}`);
    
    // Clean and validate the poem data
    const cleanPoem = {
      title: String(firstPoem.title || 'Untitled'),
      content: String(firstPoem.content || ''),
      authorId: String(firstPoem.authorId || 'author-1'),
      published: Boolean(firstPoem.published),
      pinned: Boolean(firstPoem.pinned),
      likeCount: Number(firstPoem.likeCount) || 0,
      commentCount: Number(firstPoem.commentCount) || 0,
      createdAt: new Date(firstPoem.createdAt || new Date()),
      updatedAt: new Date(firstPoem.updatedAt || new Date()),
    };
    
    console.log('Clean poem data:', cleanPoem);
    
    // Use a simple document ID for testing
    await setDoc(doc(db, 'poems', 'test-migration-1'), cleanPoem);
    
    console.log(`✅ Successfully migrated test poem!`);
    
  } catch (error) {
    console.error(`❌ Error migrating test poem:`, error);
    console.error('Error details:', error.code, error.message);
  }
  
  console.log('Test complete!');
  process.exit(0);
}

// Run migration
migratePoems().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});