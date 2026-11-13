import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { AdminInvite, AdminRecord } from '../types';
import { tsToIso } from '../services/wdsService';
import { emailToHex, formatFirebaseAuthError, sanitizePlainText } from '../utils/validation';

interface VisitorPrefs {
  displayName: string;
  authorClass: string;
}

interface AuthContextType {
  firebaseUser: User | null;
  adminRecord: AdminRecord | null;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;

  // Strict RBAC Flags (Server-Verified via Firebase Auth + Firestore /admins/{uid})
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isModerator: boolean;

  // Admin Authentication Actions (No Hardcoded Passwords; No Student Sign-In)
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  sendAdminPasswordReset: (email: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;

  // Ephemeral Visitor Session Token (anti-duplicate likes & rate limiting, NOT a user account)
  sessionToken: string;
  visitorPrefs: VisitorPrefs;
  saveVisitorPrefs: (displayName: string, authorClass: string) => void;
  clearVisitorPrefs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'wds_ephemeral_session_token';
const VISITOR_PREFS_KEY = 'wds_visitor_prefs_optional';

function getOrCreateSessionToken(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (existing && /^[a-zA-Z0-9_\-]{8,64}$/.test(existing)) {
      return existing;
    }
    const generated = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_TOKEN_KEY, generated);
    return generated;
  } catch {
    return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function loadVisitorPrefs(): VisitorPrefs {
  try {
    const raw = sessionStorage.getItem(VISITOR_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VisitorPrefs>;
      return {
        displayName: sanitizePlainText(parsed.displayName || '').slice(0, 100),
        authorClass: sanitizePlainText(parsed.authorClass || '').slice(0, 60),
      };
    }
  } catch {
    // ignore storage errors
  }
  return { displayName: '', authorClass: '' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionToken] = useState<string>(() => getOrCreateSessionToken());
  const [visitorPrefs, setVisitorPrefs] = useState<VisitorPrefs>(() => loadVisitorPrefs());

  const saveVisitorPrefs = useCallback((displayName: string, authorClass: string) => {
    const clean: VisitorPrefs = {
      displayName: sanitizePlainText(displayName).slice(0, 100),
      authorClass: sanitizePlainText(authorClass).slice(0, 60),
    };
    setVisitorPrefs(clean);
    try {
      sessionStorage.setItem(VISITOR_PREFS_KEY, JSON.stringify(clean));
    } catch {
      // ignore
    }
  }, []);

  const clearVisitorPrefs = useCallback(() => {
    setVisitorPrefs({ displayName: '', authorClass: '' });
    try {
      sessionStorage.removeItem(VISITOR_PREFS_KEY);
    } catch {
      // ignore
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    let unsubAdminDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubAdminDoc) {
        unsubAdminDoc();
        unsubAdminDoc = null;
      }

      setFirebaseUser(user);

      if (!user) {
        setAdminRecord(null);
        setAuthLoading(false);
        return;
      }

      const email = (user.email || '').toLowerCase();
      if (!user.emailVerified) {
        setAdminRecord(null);
        setAuthError(
          'Your administrator email address is not verified yet. Please check your inbox for the verification link or sign in with an authorized Google account.'
        );
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      const adminRef = doc(db, 'admins', user.uid);

      try {
        const snap = await getDoc(adminRef);

        if (!snap.exists()) {
          if (email === BOOTSTRAPPED_SUPER_ADMIN_EMAIL) {
            await setDoc(adminRef, {
              uid: user.uid,
              email,
              displayName: sanitizePlainText(user.displayName || 'WDS Chief Administrator').slice(0, 100),
              title: 'WDS Chief Administrator',
              role: 'super_admin',
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const inviteId = emailToHex(email);
            const inviteRef = doc(db, 'adminInvites', inviteId);
            const inviteSnap = await getDoc(inviteRef);

            if (inviteSnap.exists()) {
              const invite = inviteSnap.data() as AdminInvite;
              if (invite.status === 'pending' && invite.email.toLowerCase() === email) {
                const batch = writeBatch(db);
                batch.set(adminRef, {
                  uid: user.uid,
                  email,
                  displayName: sanitizePlainText(user.displayName || invite.displayName || 'WDS Administrator').slice(0, 100),
                  title: sanitizePlainText(invite.title || invite.role).slice(0, 120),
                  role: invite.role,
                  status: 'active',
                  inviteId,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                batch.update(inviteRef, { status: 'claimed' });
                await batch.commit();
              } else {
                setAdminRecord(null);
                setAuthError(
                  `Access Denied: Your administrator invitation for ${email} is ${invite.status}. Contact the Super Admin.`
                );
                await signOut(auth);
                setAuthLoading(false);
                return;
              }
            } else {
              setAdminRecord(null);
              setAuthError(
                `Access Denied: ${email} is not on the authorized WDS administrator roster. Students do not sign in on this portal.`
              );
              await signOut(auth);
              setAuthLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error verifying administrator record:', err);
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Unable to verify administrator credentials against Firestore.'
        );
        setAdminRecord(null);
        setAuthLoading(false);
        return;
      }

      unsubAdminDoc = onSnapshot(
        adminRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            setAdminRecord(null);
            setAuthError('Administrator profile no longer exists.');
            setAuthLoading(false);
            return;
          }
          const data = docSnap.data();
          const record: AdminRecord = {
            uid: docSnap.id,
            email: data.email || '',
            displayName: data.displayName || 'Administrator',
            title: data.title || '',
            role: data.role,
            status: data.status,
            inviteId: data.inviteId,
            createdAt: tsToIso(data.createdAt),
            updatedAt: data.updatedAt ? tsToIso(data.updatedAt) : undefined,
          };

          if (record.status !== 'active') {
            setAdminRecord(null);
            setAuthError('This administrator account has been disabled by the Super Admin.');
            void signOut(auth);
          } else {
            setAdminRecord(record);
            setAuthError(null);
          }
          setAuthLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `admins/${user.uid}`);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubAdminDoc) unsubAdminDoc();
    };
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (error) {
      setAuthError(formatFirebaseAuthError(error));
      return false;
    }
  };

  const sendAdminPasswordReset = async (email: string): Promise<void> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const logoutAdmin = async (): Promise<void> => {
    setAuthError(null);
    await signOut(auth);
    setAdminRecord(null);
  };

  const isAdmin = Boolean(adminRecord && adminRecord.status === 'active');
  const isSuperAdmin = Boolean(
    isAdmin &&
      (adminRecord?.role === 'super_admin' ||
        (firebaseUser?.email?.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL &&
          firebaseUser?.emailVerified))
  );
  const isEditor = Boolean(isSuperAdmin || (isAdmin && adminRecord?.role === 'editor'));
  const isModerator = Boolean(isEditor || (isAdmin && adminRecord?.role === 'moderator'));

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        adminRecord,
        authLoading,
        authError,
        clearAuthError,
        isAdmin,
        isSuperAdmin,
        isEditor,
        isModerator,
        loginWithGoogle,
        loginWithEmail,
        sendAdminPasswordReset,
        logoutAdmin,
        sessionToken,
        visitorPrefs,
        saveVisitorPrefs,
        clearVisitorPrefs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
