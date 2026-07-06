import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0305631979",
  appId: "1:1097840310635:web:90edc29052979a085ab42e",
  apiKey: "AIzaSyA4sfW5ZlVbBdGCnD8Rjw6f-QanRclsIpo",
  authDomain: "gen-lang-client-0305631979.firebaseapp.com",
  storageBucket: "gen-lang-client-0305631979.firebasestorage.app",
  messagingSenderId: "1097840310635"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
