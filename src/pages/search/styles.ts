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
    input: {
      marginTop: 18,
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.textPrimary,
    },
    filterSection: {
      marginTop: 18,
    },
    filterLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      color: theme.colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
    chipTextActive: {
      color: theme.colors.textOnPrimary,
    },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 12,
      color: theme.colors.textPrimary,
      fontSize: 22,
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
    badge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceElevated,
    },
    badgeText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    cardTitle: {
      marginTop: 10,
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    cardMeta: {
      marginTop: 4,
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: "600",
    },
    cardText: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    emptyBox: {
      marginTop: 24,
      borderRadius: 18,
      padding: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
