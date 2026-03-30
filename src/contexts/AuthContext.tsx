'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  age: number | null;
  gender: string;
  interests: string[];
  totalChats: number;
  createdAt: unknown;
  lastSeen: unknown;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadedRef = useRef(false);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
        profileLoadedRef.current = true;
      }
    } catch (error) {
      console.warn('[StrangerChat] fetchProfile error:', error);
    }
  }, []);

  const createProfile = useCallback(async (firebaseUser: User) => {
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // First time user — create new profile
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
          bio: '',
          age: null,
          gender: '',
          interests: [],
          totalChats: 0,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        };
        await setDoc(docRef, profile);
        setUserProfile(profile);
        profileLoadedRef.current = true;
      } else {
        // Existing user — load profile from Firestore
        setUserProfile(docSnap.data() as UserProfile);
        profileLoadedRef.current = true;
        // Update lastSeen silently
        setDoc(docRef, { lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    } catch (error) {
      console.warn('[StrangerChat] Firestore not ready:', error);
      // Only set fallback if we haven't loaded a real profile yet
      if (!profileLoadedRef.current) {
        setUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
          bio: '',
          age: null,
          gender: '',
          interests: [],
          totalChats: 0,
          createdAt: null,
          lastSeen: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await createProfile(firebaseUser);
      } else {
        setUserProfile(null);
        profileLoadedRef.current = false;
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [createProfile]);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createProfile(result.user);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createProfile(result.user);
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createProfile(result.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    profileLoadedRef.current = false;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
