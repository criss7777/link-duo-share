
import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
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

// Security utilities
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && ALLOWED_EMAILS.includes(email);
};

const logSecurityEvent = (event: string, details: any) => {
  console.warn(`Security Event: ${event}`, details);
  // In production, this should send to a security monitoring service
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener with enhanced security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Enhanced security validation
        if (session?.user?.email) {
          if (!validateEmail(session.user.email)) {
            logSecurityEvent('unauthorized_email_attempt', {
              email: session.user.email,
              timestamp: new Date().toISOString()
            });
            supabase.auth.signOut();
            return;
          }
          
          // Validate session integrity
          if (session.expires_at && session.expires_at * 1000 < Date.now()) {
            logSecurityEvent('expired_session_detected', {
              email: session.user.email,
              expiresAt: session.expires_at
            });
            supabase.auth.signOut();
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session with security validation
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        if (!validateEmail(session.user.email)) {
          logSecurityEvent('unauthorized_existing_session', {
            email: session.user.email
          });
          cleanupAuthState();
          supabase.auth.signOut();
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Enhanced input validation
    if (!email || !password) {
      return { 
        error: { 
          message: 'Email and password are required',
          code: 'missing_credentials'
        } 
      };
    }

    if (!validateEmail(email)) {
      logSecurityEvent('invalid_login_attempt', { email });
      return { 
        error: { 
          message: 'Access denied. Only authorized users can log in.',
          code: 'unauthorized_email'
        } 
      };
    }

    // Rate limiting check
    const attemptKey = `login_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]') as number[];
    const now = Date.now();
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 300000); // 5 minutes

    if (recentAttempts.length >= 5) {
      logSecurityEvent('rate_limit_exceeded', { email });
      return {
        error: {
          message: 'Too many login attempts. Please try again later.',
          code: 'rate_limit_exceeded'
        }
      };
    }

    try {
      // Clean up any existing auth state before signing in
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });

      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Log failed attempt
        recentAttempts.push(now);
        localStorage.setItem(attemptKey, JSON.stringify(recentAttempts));
        logSecurityEvent('login_failure', { email, error: error.message });
      } else {
        // Clear failed attempts on success
        localStorage.removeItem(attemptKey);
        logSecurityEvent('successful_login', { email });
      }

      return { error };
    } catch (error: any) {
      logSecurityEvent('login_exception', { email, error: error.message });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const userEmail = user?.email;
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      
      if (userEmail) {
        logSecurityEvent('user_logout', { email: userEmail });
      }
      
      // Force page reload for complete cleanup
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force cleanup even if signOut fails
      cleanupAuthState();
      window.location.href = '/auth';
    }
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
