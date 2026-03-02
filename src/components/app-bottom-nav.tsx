import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppTheme } from "../global/themes";

export type AppTab = "home" | "search" | "orders" | "profile";

type AppBottomNavProps = {
  theme: AppTheme;
  activeTab: AppTab;
  onOpenHome?: () => void;
  onOpenSearch?: () => void;
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
};

const tabs: { id: AppTab; label: string; short: string }[] = [
  { id: "home", label: "Inicio", short: "IN" },
  { id: "search", label: "Busca", short: "BU" },
  { id: "orders", label: "Pedidos", short: "PD" },
  { id: "profile", label: "Perfil", short: "PF" },
];

export default function AppBottomNav({
  theme,
  activeTab,
  onOpenHome,
  onOpenSearch,
  onOpenOrders,
  onOpenProfile,
}: AppBottomNavProps) {
  const style = useMemo(() => createStyles(theme), [theme]);

  function handlePress(tab: AppTab) {
    if (tab === "home") onOpenHome?.();
    if (tab === "search") onOpenSearch?.();
    if (tab === "orders") onOpenOrders?.();
    if (tab === "profile") onOpenProfile?.();
  }

  return (
    <View style={style.bottomBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity key={tab.id} style={style.bottomItem} onPress={() => handlePress(tab.id)}>
            <View style={[style.bottomIcon, isActive ? style.bottomIconActive : null]}>
              <Text style={[style.bottomIconText, isActive ? style.bottomIconTextActive : null]}>
                {tab.short}
              </Text>
            </View>
            <Text style={[style.bottomLabel, isActive ? style.bottomLabelActive : null]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      paddingTop: 10,
      paddingBottom: 20,
      paddingHorizontal: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bottomItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    bottomIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceElevated,
    },
    bottomIconActive: {
      backgroundColor: theme.colors.primary,
    },
    bottomIconText: {
      color: theme.colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    },
    bottomIconTextActive: {
      color: theme.colors.textOnPrimary,
    },
    bottomLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },
    bottomLabelActive: {
      color: theme.colors.textPrimary,
    },
  });
}
