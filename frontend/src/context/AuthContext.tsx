
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase_client } from "@/services/SupabaseClient";
import { getUserProfile } from "../services/ProfilesService"
import { Profile } from "@/types";

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state
  
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase_client.auth.getSession();
      if (session) {
        setSession(session);
        await loadProfile(session.user.id); // Wait for profile to load
      }
      setLoading(false); // Set loading to false after session/profile has loaded
    };
    
    loadSession();

    // Listen for auth state changes (login/logout)
    const { data } = supabase_client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session);
        loadProfile(session.user.id);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (user_id: string) => {
    const curr_profile = await getUserProfile(user_id);
    if(curr_profile) {
      setProfile(curr_profile);
    } else {
      console.log("could not load profile");
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, setSession, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
