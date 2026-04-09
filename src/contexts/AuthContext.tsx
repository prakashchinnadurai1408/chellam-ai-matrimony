import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface ProfileData {
  id: string;
  user_id: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  religion: string | null;
  community: string | null;
  caste: string | null;
  bio: string | null;
  education: string | null;
  education_detail: string | null;
  profession: string | null;
  income: string | null;
  location: string | null;
  state: string | null;
  height: string | null;
  marital_status: string | null;
  photo_url: string | null;
  family_type: string | null;
  father_occupation: string | null;
  mother_occupation: string | null;
  siblings: string | null;
  family_values: string | null;
  rashi: string | null;
  nakshatra: string | null;
  manglik: boolean | null;
  guna_score: number | null;
  verified: boolean | null;
  profile_complete: boolean | null;
  match_score: number | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  login: (phone: string) => Promise<void>;
  loginWithGoogle: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: Partial<ProfileData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(data ? (data as ProfileData) : null);
    return data;
  };

  useEffect(() => {
    // Set up auth listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!user;
  const isProfileComplete = profile?.profile_complete ?? false;

  const login = async (phone: string) => {
    const email = `${phone}@chellam.dev`;
    const password = `chellam_${phone}_1234`;

    // Try sign up first (registers new users), then sign in
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { phone } },
    });

    if (signUpError && !signUpError.message.includes("already registered")) {
      throw signUpError;
    }

    // Sign in (works for both existing and just-registered users)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
  };
  
  const loginWithGoogle = async (redirectPath = "/auth") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const completeProfile = async (data: Partial<ProfileData>) => {
    if (!user) return;

    // Persist the phone from auth metadata if not already provided
    const metaPhone = user.user_metadata?.phone as string | undefined;
    const phoneToSave = data.phone ?? metaPhone ?? undefined;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        ...(phoneToSave ? { phone: phoneToSave } : {}),
        profile_complete: true,
      })
      .eq("user_id", user.id);

    if (error) throw error;
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isProfileComplete, user, profile, loading,
      login, loginWithGoogle, logout, completeProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
