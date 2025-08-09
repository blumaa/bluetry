// Run this script to migrate mock data to Firestore
// Usage: npx ts-node src/scripts/migrateData.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import mockPoemsData from '../data/mock-poems.json';

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
  
  for (const poem of mockPoemsData) {
    try {
      // Use the existing poem ID to maintain consistency
      await setDoc(doc(db, 'poems', poem.id), {
        ...poem,
        createdAt: new Date(poem.createdAt),
        updatedAt: new Date(poem.updatedAt),
      });
      
      console.log(`✅ Migrated poem: ${poem.title}`);
    } catch (error) {
      console.error(`❌ Error migrating poem ${poem.title}:`, error);
    }
  }
  
  console.log('✨ Migration complete!');
}

// Run migration
migratePoems().catch(console.error);