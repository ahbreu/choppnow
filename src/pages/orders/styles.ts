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
      paddingBottom: 120,
      paddingHorizontal: 20,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },
    subtitle: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    sectionTitle: {
      marginTop: 22,
      marginBottom: 12,
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    orderId: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    statusBadge: {
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
    },
    cardText: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    totalText: {
      marginTop: 10,
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyCard: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    ctaButton: {
      marginTop: 14,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaButtonText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "700",
      fontSize: 15,
    },
  });
}
