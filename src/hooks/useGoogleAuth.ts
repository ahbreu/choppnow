import { useEffect, useState } from "react";
import { GoogleIdentity } from "../services/auth/gateway";
import { useGoogleRequest } from "../services/auth/google";

export function useGoogleAuth() {
  const { request, response, promptAsync, isConfigured } = useGoogleRequest();
  const [user, setUser] = useState<GoogleIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!request) {
      setError("Google auth ainda nao esta pronto neste device.");
      return false;
    }
    if (!isConfigured) {
      setError("Google OAuth indisponivel neste build. Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID.");
      return false;
    }

    setLoading(true);
    try {
      setError(null);
      await promptAsync();
      return true;
    } catch {
      setError("Nao foi possivel iniciar o login com Google.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function clearUser() {
    setUser(null);
    setError(null);
  }

  useEffect(() => {
    async function handleResponse() {
      if (!response) return;
      if (response.type === "cancel" || response.type === "dismiss") return;
      if (response.type !== "success") {
        setError("Falha no login com Google.");
        return;
      }

      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        setError("Google nao retornou um token valido.");
        return;
      }

      try {
        const profileRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!profileRes.ok) {
          throw new Error("google-profile-fetch-failed");
        }

        const profile = await profileRes.json();
        const mapped: GoogleIdentity = {
          id: String(profile.id),
          email: String(profile.email),
          name: String(profile.name),
          picture: profile.picture ? String(profile.picture) : undefined,
        };

        setUser(mapped);
        setError(null);
      } catch {
        setError("Nao foi possivel carregar seu perfil do Google.");
      }
    }

    handleResponse();
  }, [response]);

  return {
    request,
    isConfigured,
    user,
    loading,
    error,
    signIn,
    clearUser,
  };
}
