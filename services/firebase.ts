import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDP52lerF5mYZl8Lomnue5ti1kTEKsC2jg",
  authDomain: "decorinfoco-cbc53.firebaseapp.com",
  projectId: "decorinfoco-cbc53",
  storageBucket: "decorinfoco-cbc53.firebasestorage.app",
  messagingSenderId: "595376449460",
  appId: "1:595376449460:web:f979a08c5a5a8d6f2c74e1",
  measurementId: "G-3LF09Q8WX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export a constante para ser usada na reautenticação
export { app, auth, db };
