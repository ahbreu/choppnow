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
    itemCard: {
      marginTop: 14,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderColor: theme.colors.border,
      borderWidth: 1,
      padding: 14,
    },
    itemTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      color: theme.colors.textPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    itemMeta: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    itemPrice: {
      color: theme.colors.primaryGlow,
      fontWeight: "700",
      fontSize: 15,
    },
    addOnList: {
      marginTop: 10,
      gap: 4,
    },
    addOnText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 17,
    },
    itemActionsRow: {
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    quantityStepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepperButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stepperButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    quantityText: {
      color: theme.colors.textPrimary,
      fontWeight: "700",
      minWidth: 16,
      textAlign: "center",
    },
    removeText: {
      color: theme.colors.error,
      fontWeight: "700",
      fontSize: 13,
    },
    summaryCard: {
      marginTop: 18,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderColor: theme.colors.border,
      borderWidth: 1,
      padding: 14,
      gap: 10,
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
