import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { account, isAppwriteConfigured } from '../services/appwrite';

const AuthContext = createContext(null);

function isUnauthorized(error) {
  return error?.code === 401 || error?.type === 'general_unauthorized';
}

function getAuthErrorMessage(error, fallback = 'Authentication is unavailable right now.') {
  if (isUnauthorized(error)) {
    return 'The email or password was not accepted.';
  }

  if (error?.code === 429) {
    return 'Too many sign-in attempts. Please wait and try again.';
  }

  // Do not expose provider/network details to the browser UI.
  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isAppwriteConfigured);
  const [error, setError] = useState('');
  const refreshStarted = useRef(false);

  const refreshUser = useCallback(async () => {
    if (!account) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = await account.get();
      setUser(currentUser);
      return currentUser;
    } catch (requestError) {
      setUser(null);
      if (!isUnauthorized(requestError)) {
        setError(getAuthErrorMessage(requestError, 'Unable to restore the Appwrite session.'));
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (refreshStarted.current) {
      return;
    }
    refreshStarted.current = true;
    void refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (email, password) => {
    if (!account) {
      throw new Error('Appwrite authentication is not configured.');
    }

    setError('');
    await account.createEmailPasswordSession({ email: email.trim(), password });
    const currentUser = await account.get();
    setUser(currentUser);
    return currentUser;
  }, []);

  const signOut = useCallback(async () => {
    if (!account) {
      setUser(null);
      return;
    }

    setError('');
    await account.deleteSession('current');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      configured: isAppwriteConfigured,
      error,
      loading,
      signIn,
      signOut,
      user,
      refreshUser,
      clearError: () => setError(''),
    }),
    [error, loading, refreshUser, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}

export { getAuthErrorMessage };
