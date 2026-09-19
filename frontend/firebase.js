import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for CCTC SafeSpace
const firebaseConfig = {
  apiKey: 'AIzaSyCWS_4wsw5Z_3LL_8MKXbXpg5LzB9T9wm4',
  authDomain: 'cctcsafespace.firebaseapp.com',
  projectId: 'cctcsafespace',
  storageBucket: 'cctcsafespace.firebasestorage.app',
  messagingSenderId: '618261363898',
  appId: '1:618261363898:web:47519998d824db21519683'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

