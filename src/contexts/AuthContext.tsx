"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  onboardingDismissedAt: string | null;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  dismissOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  onboardingCompleted: false,
  onboardingDismissedAt: null,
  signOut: async () => {},
  completeOnboarding: async () => {},
  dismissOnboarding: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingDismissedAt, setOnboardingDismissedAt] = useState<string | null>(null);

  // Fetch user profile data including onboarding status
  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setOnboardingCompleted(data.profile?.onboarding_completed || false);
        setOnboardingDismissedAt(data.profile?.onboarding_dismissed_at || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setOnboardingCompleted(false);
          setOnboardingDismissedAt(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const completeOnboarding = async () => {
    try {
      const response = await fetch('/api/profile/onboarding/complete', {
        method: 'POST',
      });
      if (response.ok) {
        setOnboardingCompleted(true);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const dismissOnboarding = async () => {
    try {
      const response = await fetch('/api/profile/onboarding/dismiss', {
        method: 'POST',
      });
      if (response.ok) {
        setOnboardingDismissedAt(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
    }
  };

  // AuthContext should NOT render its own loading UI - let AppShell handle it
  // This prevents layered/duplicate loading spinners
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      onboardingCompleted,
      onboardingDismissedAt,
      signOut,
      completeOnboarding,
      dismissOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
}