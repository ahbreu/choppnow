import { useEffect, useMemo, useState } from "react";
import { demoAuthGateway } from "../services/auth/demo";
import { AuthProvider, AuthSession, AuthSessionUser } from "../services/auth/gateway";
import { refreshRemoteSession, shouldFallbackToLocalAuth, signInRemote, signOutRemote } from "../services/auth/remote";
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
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const demoAccounts = useMemo(() => demoAuthGateway.listDemoAccounts(), []);
  const currentUser = currentSession?.user ?? null;
  const authProvider = currentSession?.provider ?? null;

  useEffect(() => {
    let mounted = true;

    loadPersistedAuthSession()
      .then(async (storedSession) => {
        if (!mounted || !storedSession) return;

        if (storedSession.provider !== "remote") {
          setCurrentSession(storedSession);
          return;
        }

        try {
          const refreshedSession = await refreshRemoteSession(storedSession);
          if (!mounted) return;
          setCurrentSession(refreshedSession);
          setAuthMessage(null);
        } catch (error) {
          if (!mounted) return;

          if (shouldFallbackToLocalAuth(error)) {
            setCurrentSession(storedSession);
            setAuthMessage("Sessao remota mantida em modo offline.");
            return;
          }

          setCurrentSession(null);
          setAuthMessage("Sessao remota expirada. Faca login novamente.");
        }
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

    setCurrentSession(createAuthSession("google", createGoogleBuyerProfile(googleAuth.user)));
    setAuthMessage(null);
  }, [googleAuth.user]);

  useEffect(() => {
    if (!googleAuth.error) return;
    setAuthMessage(googleAuth.error);
  }, [googleAuth.error]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!currentSession) {
      clearPersistedAuthSession().catch(() => {
        // Ignore session cleanup failures and keep runtime auth usable.
      });
      return;
    }

    persistAuthSession(currentSession).catch(() => {
      // Ignore persistence failures and keep runtime auth usable.
    });
  }, [currentSession, isAuthReady]);

  async function signInWithEmail(email: string, password: string) {
    setAuthMessage(null);
    googleAuth.clearUser();

    try {
      const remoteSession = await signInRemote(email, password);
      setCurrentSession(remoteSession);
      return true;
    } catch (error) {
      if (shouldFallbackToLocalAuth(error)) {
        const user = demoAuthGateway.signInWithEmail(email, password);
        if (!user) return false;

        setCurrentSession(createAuthSession("demo", user));
        return true;
      }

      setAuthMessage(error instanceof Error ? error.message : "Nao foi possivel iniciar sessao.");
      return false;
    }
  }

  async function signInWithDemoAccount(userId: string) {
    const user = demoAuthGateway.getUserById(userId);
    if (!user) return false;

    return signInWithEmail(user.email, user.password);
  }

  async function signInWithGoogle() {
    setAuthMessage(null);
    return googleAuth.signIn();
  }

  async function signOut() {
    const sessionToClose = currentSession;
    googleAuth.clearUser();
    setCurrentSession(null);
    setAuthMessage(null);

    if (sessionToClose?.provider === "remote") {
      await signOutRemote(sessionToClose);
    }
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
