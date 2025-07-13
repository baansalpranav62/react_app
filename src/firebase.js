import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace this with your actual Firebase config from Firebase Console
// Go to Project Settings > Your apps > Config
const firebaseConfig = {
  apiKey: "AIzaSyDr9mERUtbCSLzeJaHZtAOT1CMwSrpwvvE",
  authDomain: "hotel-registration-syste-8eafe.firebaseapp.com",
  projectId: "hotel-registration-syste-8eafe",
  storageBucket: "hotel-registration-syste-8eafe.firebasestorage.app",
  messagingSenderId: "670027996501",
  appId: "1:670027996501:web:f46f33c07c4c572f2623dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app; 