export type ThemeMode = "dark" | "light";

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    primary: string;
    primaryHover: string;
    primaryDark: string;
    primaryGlow: string;
    accent: string;
    accentHover: string;
    accentSoft: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
};

export const darkTheme: AppTheme = {
  mode: "dark",
  colors: {
    background: "#0A0A0A",
    surface: "#141414",
    surfaceElevated: "#1D1D1D",
    border: "#2D2D2D",
    primary: "#F5C518",
    primaryHover: "#FFD33D",
    primaryDark: "#C79406",
    primaryGlow: "#FFE58A",
    accent: "#D62828",
    accentHover: "#FF554F",
    accentSoft: "#3A1111",
    textPrimary: "#FFFFFF",
    textSecondary: "#E5E5E5",
    textMuted: "#A3A3A3",
    textOnPrimary: "#111111",
    success: "#F5C518",
    warning: "#FFD33D",
    error: "#E53935",
    info: "#FFFFFF",
  },
};

export const lightTheme: AppTheme = {
  mode: "light",
  colors: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceElevated: "#FFF5D1",
    border: "#E6E6E6",
    primary: "#F5C518",
    primaryHover: "#F0B400",
    primaryDark: "#C79406",
    primaryGlow: "#FFE58A",
    accent: "#D62828",
    accentHover: "#BE1F1F",
    accentSoft: "#F8D9D9",
    textPrimary: "#111111",
    textSecondary: "#2B2B2B",
    textMuted: "#636363",
    textOnPrimary: "#111111",
    success: "#C79406",
    warning: "#F0B400",
    error: "#D62828",
    info: "#111111",
  },
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}
