import { StyleSheet } from "react-native";
import { AppTheme } from "../../global/themes";

export function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingTop: 62,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    topAction: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    topActionText: {
      color: theme.colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    pageTitle: {
      color: theme.colors.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },
    pageSubtitle: {
      marginTop: 6,
      marginBottom: 16,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
    },
    badge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    cardTitle: {
      marginTop: 10,
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    cardMeta: {
      marginTop: 4,
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: "600",
    },
    cardDescription: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    cardFoot: {
      marginTop: 8,
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
