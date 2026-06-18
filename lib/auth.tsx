"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CurrentUser = { id: number; name: string; isAdmin: boolean };

const STORAGE_KEY = "guystrip.user";

type AuthContextValue = {
  /** the signed-in profile, or null */
  currentUser: CurrentUser | null;
  /** true once we've read localStorage (avoids hydration flicker) */
  ready: boolean;
  /** persist a selected/created profile */
  signIn: (user: CurrentUser) => void;
  /** forget the current profile */
  signOut: () => void;
  /**
   * Ensure a profile is selected before an action.
   * Resolves immediately if signed in; otherwise opens the picker and
   * resolves once the user picks (or null if they cancel).
   */
  requireUser: () => Promise<CurrentUser | null>;
  /** picker modal visibility (also openable directly) */
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // pending resolver for an in-flight requireUser() call
  const resolverRef = useRef<((u: CurrentUser | null) => void) | null>(null);

  // hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCurrentUser(JSON.parse(raw) as CurrentUser);
    } catch {
      // ignore corrupt storage
    }
    setReady(true);
  }, []);

  const signIn = useCallback((user: CurrentUser) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setCurrentUser(user);
    setPickerOpen(false);
    resolverRef.current?.(user);
    resolverRef.current = null;
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(null);
  }, []);

  const openPicker = useCallback(() => setPickerOpen(true), []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    // a cancelled requireUser() resolves to null
    resolverRef.current?.(null);
    resolverRef.current = null;
  }, []);

  const requireUser = useCallback(() => {
    if (currentUser) return Promise.resolve(currentUser);
    setPickerOpen(true);
    return new Promise<CurrentUser | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        ready,
        signIn,
        signOut,
        requireUser,
        pickerOpen,
        openPicker,
        closePicker,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
