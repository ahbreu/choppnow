import { useEffect, useMemo, useState } from "react";
import { demoAuthGateway } from "../services/auth/demo";
import { AuthProvider, AuthSessionUser } from "../services/auth/gateway";
import {
  clearPersistedAuthSession,
  createAuthSession,
  createGoogleBuyerProfile,
  loadPersistedAuthSession,
  persistAuthSession,
} from "../services/auth/session";
import { useGoogleAuth } from "./useGoogleAuth";

export function useAuthSession() {
  const googleAuth = useGoogleAuth();
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProvider | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const demoAccounts = useMemo(() => demoAuthGateway.listDemoAccounts(), []);

  useEffect(() => {
    let mounted = true;

    loadPersistedAuthSession()
      .then((storedSession) => {
        if (!mounted || !storedSession) return;
        setCurrentUser(storedSession.user);
        setAuthProvider(storedSession.provider);
      })
      .finally(() => {
        if (mounted) {
          setIsAuthReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleAuth.user) return;

    setCurrentUser(createGoogleBuyerProfile(googleAuth.user));
    setAuthProvider("google");
    setAuthMessage(null);
  }, [googleAuth.user]);

  useEffect(() => {
    if (!googleAuth.error) return;
    setAuthMessage(googleAuth.error);
  }, [googleAuth.error]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!currentUser || !authProvider) {
      clearPersistedAuthSession().catch(() => {
        // Ignore session cleanup failures and keep runtime auth usable.
      });
      return;
    }

    persistAuthSession(createAuthSession(authProvider, currentUser)).catch(() => {
      // Ignore persistence failures and keep runtime auth usable.
    });
  }, [authProvider, currentUser, isAuthReady]);

  function signInWithEmail(email: string, password: string) {
    const user = demoAuthGateway.signInWithEmail(email, password);
    if (!user) return false;

    googleAuth.clearUser();
    setCurrentUser(user);
    setAuthProvider("demo");
    setAuthMessage(null);
    return true;
  }

  function signInWithDemoAccount(userId: string) {
    const user = demoAuthGateway.getUserById(userId);
    if (!user) return false;

    googleAuth.clearUser();
    setCurrentUser(user);
    setAuthProvider("demo");
    setAuthMessage(null);
    return true;
  }

  async function signInWithGoogle() {
    return googleAuth.signIn();
  }

  function signOut() {
    googleAuth.clearUser();
    setCurrentUser(null);
    setAuthProvider(null);
    setAuthMessage(null);
  }

  const googleStatusMessage = useMemo(() => {
    if (authMessage) return authMessage;
    if (!googleAuth.isConfigured) {
      return "Google OAuth indisponivel neste build. Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID.";
    }
    return null;
  }, [authMessage, googleAuth.isConfigured]);

  return {
    authProvider,
    authMessage,
    currentUser,
    demoAccounts,
    googleStatusMessage,
    isAuthReady,
    isGoogleLoading: googleAuth.loading,
    canSignInWithGoogle: Boolean(googleAuth.request) && googleAuth.isConfigured,
    signInWithDemoAccount,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
}
