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
      paddingBottom: 28,
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
    headerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
    },
    badge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: theme.colors.primary,
      fontWeight: "700",
      fontSize: 14,
    },
    beerName: {
      marginTop: 12,
      color: theme.colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
    },
    beerMeta: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    beerPrice: {
      marginTop: 6,
      color: theme.colors.primaryGlow,
      fontSize: 16,
      fontWeight: "700",
    },
    infoCard: {
      marginTop: 14,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      gap: 6,
    },
    sectionTitle: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    infoText: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
    ratingText: {
      color: theme.colors.success,
      fontWeight: "700",
      fontSize: 16,
    },
    linkText: {
      color: theme.colors.primary,
      fontWeight: "700",
      fontSize: 15,
      textDecorationLine: "underline",
    },
    primaryButton: {
      marginTop: 18,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      height: 52,
    },
    primaryButtonText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
    },
    emptyTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    emptyButton: {
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    emptyButtonText: {
      color: theme.colors.textPrimary,
      fontWeight: "600",
    },
  });
}
