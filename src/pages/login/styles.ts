import { StyleSheet } from "react-native";
import { AppTheme } from "../../global/themes";

export function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: theme.colors.background,
    },
    topPanel: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
      paddingBottom: 20,
    },
    loginPanel: {
      width: "100%",
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 34,
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: theme.colors.border,
    },
    logo: {
      width: 280,
      height: 180,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    placeholder: {
      color: theme.colors.textMuted,
    },
    input: {
      width: "100%",
      height: 52,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    primaryButton: {
      width: "100%",
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    primaryButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      width: "100%",
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    secondaryButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    guestButton: {
      marginTop: 14,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    guestButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    backButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    backButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
