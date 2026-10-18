// Firebase configuration provided by user
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAu4k8VScF31hq1leTEIFBu7ralB9g-gaY",
  authDomain: "ai-project-82371.firebaseapp.com",
  projectId: "ai-project-82371",
  storageBucket: "ai-project-82371.firebasestorage.app",
  messagingSenderId: "160698203836",
  appId: "1:160698203836:web:9be8684368a7c07d13dab9",
  measurementId: "G-0TQLKL2K6Q"
};

// Initialize Firebase safely
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);

// Initialize Analytics conditionally when supported in browser environment
export let firebaseAnalytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported: boolean) => {
    if (supported) {
      try {
        firebaseAnalytics = getAnalytics(firebaseApp);
      } catch (e) {
        console.warn('Firebase analytics initialization skipped:', e);
      }
    }
  });
}
