/**
 * TichPhong Core 5.1.1 - Firebase Configuration
 */
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, indexedDBLocalPersistence, browserLocalPersistence, Auth } from "firebase/auth";

// Firebase config types
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

// Firebase config - Only using Auth (Google Login)
const firebaseConfig: FirebaseConfig = {
    apiKey: 'mock' as string,
    authDomain: 'mock' as string,
    projectId: 'mock' as string,
    storageBucket: 'mock' as string,
    messagingSenderId: 'mock' as string,
    appId: 'mock' as string,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Persist auth state - prefer IndexedDB for better Safari/iOS support
// Fallback to localStorage if IndexedDB fails
setPersistence(auth, indexedDBLocalPersistence)
    .catch(() => {
        console.log('[Firebase] IndexedDB not available, falling back to localStorage');
        return setPersistence(auth, browserLocalPersistence);
    })
    .catch((error: any) => {
        console.error("Firebase Persistence Error:", error);
    });

// Configure Google Provider with explicit scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
// Force account selection every time (prevents caching issues)
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

