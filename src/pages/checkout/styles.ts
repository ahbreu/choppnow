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
      paddingBottom: 36,
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
    blockCard: {
      marginTop: 14,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      gap: 10,
    },
    blockTitle: {
      color: theme.colors.textPrimary,
      fontWeight: "800",
      fontSize: 16,
    },
    blockText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    blockStrong: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    input: {
      marginTop: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      color: theme.colors.textPrimary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
    },
    paymentRow: {
      flexDirection: "row",
      gap: 8,
    },
    paymentChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    paymentChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    paymentChipText: {
      color: theme.colors.textPrimary,
      fontWeight: "700",
      fontSize: 13,
    },
    paymentChipTextActive: {
      color: theme.colors.textOnPrimary,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    summaryValue: {
      color: theme.colors.textPrimary,
      fontWeight: "600",
      fontSize: 14,
    },
    summaryTotalLabel: {
      color: theme.colors.textPrimary,
      fontWeight: "800",
      fontSize: 16,
    },
    summaryTotalValue: {
      color: theme.colors.primaryGlow,
      fontWeight: "800",
      fontSize: 16,
    },
    ctaButton: {
      marginTop: 16,
      height: 52,
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
