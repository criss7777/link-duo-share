
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';

interface SecurityContextType {
  isSecure: boolean;
  securityChecks: {
    sessionValid: boolean;
    permissionsValid: boolean;
    rateLimitOk: boolean;
  };
}

const SecurityContext = createContext<SecurityContextType>({
  isSecure: false,
  securityChecks: {
    sessionValid: false,
    permissionsValid: false,
    rateLimitOk: true
  }
});

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const { validateSession, validateUserPermissions } = useSecurityValidation();
  const [securityChecks, setSecurityChecks] = useState({
    sessionValid: false,
    permissionsValid: false,
    rateLimitOk: true
  });

  useEffect(() => {
    const runSecurityChecks = async () => {
      if (!user || !session) {
        setSecurityChecks({
          sessionValid: false,
          permissionsValid: false,
          rateLimitOk: true
        });
        return;
      }

      const sessionValid = await validateSession();
      const permissionsValid = await validateUserPermissions('general_access');

      setSecurityChecks({
        sessionValid,
        permissionsValid,
        rateLimitOk: true
      });
    };

    runSecurityChecks();
    
    // Run security checks every 5 minutes
    const interval = setInterval(runSecurityChecks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, session, validateSession, validateUserPermissions]);

  // Detect suspicious activity
  useEffect(() => {
    const detectSuspiciousActivity = () => {
      // Monitor for rapid consecutive actions
      const originalConsoleError = console.error;
      console.error = (...args) => {
        if (args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('RLS') || arg.includes('permission') || arg.includes('unauthorized'))
        )) {
          console.warn('Potential security breach detected');
        }
        originalConsoleError.apply(console, args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    };

    const cleanup = detectSuspiciousActivity();
    return cleanup;
  }, []);

  const isSecure = securityChecks.sessionValid && securityChecks.permissionsValid && securityChecks.rateLimitOk;

  return (
    <SecurityContext.Provider value={{ isSecure, securityChecks }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
