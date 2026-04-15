import { useEffect, useState } from "react";
import { ThemeMode } from "../global/themes";
import { getItem, saveItem } from "../utils/storage";

const THEME_STORAGE_KEY = "choppnow-theme-mode";

export function useThemePreference(defaultMode: ThemeMode = "dark") {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const savedTheme = await getItem<ThemeMode>(THEME_STORAGE_KEY);
        if (!mounted) return;
        if (savedTheme === "dark" || savedTheme === "light") {
          setThemeMode(savedTheme);
        }
      } catch {
        // Keep default theme when storage is unavailable.
      } finally {
        if (mounted) {
          setIsThemeReady(true);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    saveItem(THEME_STORAGE_KEY, themeMode).catch(() => {
      // Ignore persistence failures and keep app usable.
    });
  }, [isThemeReady, themeMode]);

  return {
    themeMode,
    setThemeMode,
  };
}
