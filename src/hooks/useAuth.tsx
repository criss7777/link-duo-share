
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed users - only these emails can log in
const ALLOWED_EMAILS = ['user1@example.com', 'user2@example.com'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Check if user email is allowed
        if (session?.user?.email && !ALLOWED_EMAILS.includes(session.user.email)) {
          console.log('Unauthorized email attempted login:', session.user.email);
          // Sign out unauthorized user
          supabase.auth.signOut();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if user email is allowed
      if (session?.user?.email && !ALLOWED_EMAILS.includes(session.user.email)) {
        console.log('Unauthorized email in existing session:', session.user.email);
        // Sign out unauthorized user
        supabase.auth.signOut();
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if email is allowed before attempting login
    if (!ALLOWED_EMAILS.includes(email)) {
      return { 
        error: { 
          message: 'Access denied. Only authorized users can log in.',
          code: 'unauthorized_email'
        } 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
