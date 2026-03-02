import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppTheme, ThemeMode } from "../global/themes";

type ThemeToggleProps = {
  theme: AppTheme;
  mode: ThemeMode;
  onToggle?: () => void;
};

export default function ThemeToggle({ theme, mode, onToggle }: ThemeToggleProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const isDark = mode === "dark";

  return (
    <TouchableOpacity style={style.container} onPress={onToggle}>
      <Text style={style.label}>{isDark ? "Escuro" : "Claro"}</Text>
      <View style={[style.track, isDark ? style.trackDark : style.trackLight]}>
        <View style={[style.thumb, isDark ? style.thumbRight : style.thumbLeft]} />
      </View>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      top: 60,
      right: 18,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    label: {
      color: theme.colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    track: {
      width: 38,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 3,
      alignItems: "center",
      flexDirection: "row",
    },
    trackDark: {
      justifyContent: "flex-end",
      backgroundColor: theme.colors.accent,
    },
    trackLight: {
      justifyContent: "flex-start",
      backgroundColor: theme.colors.primary,
    },
    thumb: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.textPrimary,
    },
    thumbLeft: {
      marginLeft: 0,
    },
    thumbRight: {
      marginRight: 0,
    },
  });
}
