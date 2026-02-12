import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBe9-dxOdctNEsemEEHLep0YEoM5KSlEs8",
  authDomain: "safepress-9f50c.firebaseapp.com",
  projectId: "safepress-9f50c",
  storageBucket: "safepress-9f50c.firebasestorage.app",
  messagingSenderId: "113890207754",
  appId: "1:113890207754:web:52ea5813a3bfbb404197f3",
  measurementId: "G-R7BYJ088ZV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
