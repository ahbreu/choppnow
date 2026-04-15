import { StyleSheet } from "react-native";
import { AppTheme } from "../../global/themes";

export function createStyles(theme: AppTheme) {
  const isDark = theme.mode === "dark";
  const palette = {
    base: isDark ? "#090909" : "#FFFFFF",
    card: isDark ? "#151515" : "#FFFDF5",
    cardStrong: isDark ? "#1E1E1E" : "#FFF7D1",
    border: isDark ? "#2B2B2B" : "#E6E6E6",
    textPrimary: isDark ? "#FFFFFF" : "#111111",
    textSecondary: isDark ? "#D0D0D0" : "#3A3A3A",
    muted: isDark ? "#A3A3A3" : "#6B6B6B",
    yellow: "#F5C518",
    red: "#D7263D",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.base,
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
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    topActionText: {
      color: palette.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    pageTitle: {
      color: palette.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },
    pageSubtitle: {
      marginTop: 6,
      marginBottom: 10,
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    runtimeStatusCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.cardStrong,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    runtimeStatusTitle: {
      color: palette.yellow,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    runtimeStatusText: {
      marginTop: 6,
      color: palette.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    filterRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 8,
      rowGap: 8,
      marginBottom: 12,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    filterChipActive: {
      borderColor: palette.yellow,
      backgroundColor: palette.yellow,
    },
    filterChipText: {
      color: palette.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    filterChipTextActive: {
      color: "#111111",
    },
    storylineCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.cardStrong,
      padding: 12,
      marginBottom: 10,
    },
    storylineTitle: {
      color: palette.red,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    storylineText: {
      marginTop: 6,
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    campaignStrip: {
      flexDirection: "row",
      columnGap: 8,
      marginBottom: 12,
    },
    campaignTag: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    campaignTagTitle: {
      color: palette.yellow,
      fontSize: 11,
      fontWeight: "700",
    },
    card: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
    },
    badge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: palette.cardStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: palette.yellow,
      fontSize: 12,
      fontWeight: "700",
    },
    cardTitle: {
      marginTop: 10,
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    cardMeta: {
      marginTop: 4,
      color: palette.red,
      fontSize: 13,
      fontWeight: "600",
    },
    cardDescription: {
      marginTop: 6,
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    cardFoot: {
      marginTop: 8,
      color: palette.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    emptyState: {
      marginTop: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.cardStrong,
      padding: 14,
      marginBottom: 8,
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    emptySubtitle: {
      marginTop: 4,
      color: palette.textSecondary,
      fontSize: 12,
    },
  });
}
