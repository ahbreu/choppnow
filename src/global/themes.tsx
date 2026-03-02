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
    background: "#0B1C2D",        // Azul petróleo profundo
    surface: "#112A44",           // Azul médio
    surfaceElevated: "#163555",   // Azul mais claro para destaque
    border: "#1F3A56",

    primary: "#D4AF37",           // Dourado clássico
    primaryHover: "#F5C518",      // Dourado vibrante
    primaryDark: "#B8932F",       // Dourado escuro
    primaryGlow: "#FFD700",       // Glow dourado

    accent: "#2563EB",            // Azul vibrante
    accentHover: "#3B82F6",
    accentSoft: "#1E3A8A",

    textPrimary: "#FFFFFF",
    textSecondary: "#C9D4E3",
    textMuted: "#8CA3B8",
    textOnPrimary: "#0B1C2D",

    success: "#22C55E",
    warning: "#FACC15",
    error: "#DC2626",
    info: "#38BDF8",
  },
};

export const lightTheme: AppTheme = {
  mode: "light",
  colors: {
    background: "#F4F7FB",        // Branco azulado
    surface: "#FFFFFF",
    surfaceElevated: "#EAF1F8",
    border: "#D6E2F0",

    primary: "#D4AF37",
    primaryHover: "#E6C76A",
    primaryDark: "#B8932F",
    primaryGlow: "#F5C518",

    accent: "#1E3A8A",
    accentHover: "#2563EB",
    accentSoft: "#DBEAFE",

    textPrimary: "#0B1C2D",
    textSecondary: "#334155",
    textMuted: "#64748B",
    textOnPrimary: "#0B1C2D",

    success: "#16A34A",
    warning: "#EAB308",
    error: "#B91C1C",
    info: "#0284C7",
  },
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}
