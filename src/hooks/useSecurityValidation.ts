
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect } from 'react';

export const useSecurityValidation = () => {
  const { user, session } = useAuth();

  // Validate session integrity
  const validateSession = useCallback(async () => {
    if (!session || !user) return false;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.warn('Invalid session detected');
        await supabase.auth.signOut();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, [session, user]);

  // Validate user permissions
  const validateUserPermissions = useCallback(async (requiredAction: string) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.warn('User profile not found');
        return false;
      }

      // Additional permission checks can be added here
      return true;
    } catch (error) {
      console.error('Permission validation failed:', error);
      return false;
    }
  }, [user]);

  // Input sanitization
  const sanitizeInput = useCallback((input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }, []);

  // URL validation
  const validateUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }, []);

  // Rate limiting check (client-side basic protection)
  const checkRateLimit = useCallback((action: string, maxAttempts: number = 10, timeWindow: number = 60000) => {
    const key = `rateLimit_${action}_${user?.id}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || '[]') as number[];
    
    // Clean old attempts
    const recentAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(recentAttempts));
    return true;
  }, [user?.id]);

  return {
    validateSession,
    validateUserPermissions,
    sanitizeInput,
    validateUrl,
    checkRateLimit
  };
};
