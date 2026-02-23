// src/hooks/useGoogleAuth.ts
import { useEffect, useState } from "react";
import { useGoogleRequest } from "../services/auth/google";
import { saveItem, removeItem, getItem } from "../utils/storage";

type GoogleUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

const STORAGE_KEY = "@choppnow:user";

export function useGoogleAuth() {
  const { request, response, promptAsync } = useGoogleRequest();
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSession() {
    const saved = await getItem<GoogleUser>(STORAGE_KEY);
    if (saved) setUser(saved);
  }

  async function signIn() {
    setLoading(true);
    try {
      await promptAsync(); // <-- sem useProxy
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setUser(null);
    await removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    async function handleResponse() {
      if (response?.type !== "success") return;

      const accessToken = response.authentication?.accessToken;
      if (!accessToken) return;

      const profileRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const profile = await profileRes.json();

      const mapped: GoogleUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };

      setUser(mapped);
      await saveItem(STORAGE_KEY, mapped);
    }

    handleResponse();
  }, [response]);

  return {
    request,
    user,
    loading,
    signIn,
    signOut,
  };
}