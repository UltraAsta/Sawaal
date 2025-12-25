import { supabase } from "@/initSupabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

type CleanupCallback = () => void;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  resetActivityTimeout: () => void;
  registerCleanupCallback: (callback: CleanupCallback) => void;
  unregisterCleanupCallback: (callback: CleanupCallback) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  resetActivityTimeout: () => {},
  registerCleanupCallback: () => {},
  unregisterCleanupCallback: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupCallbacksRef = useRef<Set<CleanupCallback>>(new Set());

  // Register a cleanup callback
  const registerCleanupCallback = useCallback((callback: CleanupCallback) => {
    cleanupCallbacksRef.current.add(callback);
  }, []);

  // Unregister a cleanup callback
  const unregisterCleanupCallback = useCallback((callback: CleanupCallback) => {
    cleanupCallbacksRef.current.delete(callback);
  }, []);

  // Cleanup function to be called on logout
  const performCleanup = () => {
    setUser(null);
    setSession(null);

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Call all registered cleanup callbacks
    cleanupCallbacksRef.current.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in cleanup callback:", error);
      }
    });
  };

  // Forward declaration for signOut
  const signOutRef = useRef<(() => Promise<void>) | null>(null);

  // Reset the inactivity timeout
  const resetActivityTimeout = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if user is logged in
    if (session) {
      timeoutRef.current = setTimeout(async () => {
        console.log("Session expired due to inactivity");
        if (signOutRef.current) {
          await signOutRef.current();
        }
      }, SESSION_TIMEOUT);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Start inactivity timer if session exists
      if (session) {
        resetActivityTimeout();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      if (event === "SIGNED_IN" && session) {
        resetActivityTimeout();
      } else if (event === "SIGNED_OUT") {
        performCleanup();
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Check if token refresh failed or session is invalid
        const expiresAt = session.expires_at;
        if (expiresAt && expiresAt * 1000 < Date.now()) {
          console.log("Session expired - token refresh failed");
          signOut();
        } else {
          resetActivityTimeout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const signOut = async () => {
    try {
      performCleanup();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Still perform cleanup even if signOut fails
      performCleanup();
    }
  };

  // Set the signOut ref for use in timeout
  signOutRef.current = signOut;

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, resetActivityTimeout, registerCleanupCallback, unregisterCleanupCallback }}>
      {children}
    </AuthContext.Provider>
  );
}
