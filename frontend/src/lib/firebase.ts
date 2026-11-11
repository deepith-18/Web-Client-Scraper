// Demanex - Firebase Configuration & Google Authentication
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA9v-4_ikcr3CHT7QmENTdRBHMINUOpPXI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demanex.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demanex",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demanex.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "305113858110",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:305113858110:web:84eece330f974d1d8fd16f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BP1LGBJJ63",
};

// Avoid re-initializing during Next.js Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Custom parameters to always prompt account selector
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/** Opens Google sign-in popup and returns the Firebase user + ID token */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; idToken: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

/** Signs out from Firebase */
export async function firebaseLogout(): Promise<void> {
  await firebaseSignOut(auth);
}

export { app, auth };
