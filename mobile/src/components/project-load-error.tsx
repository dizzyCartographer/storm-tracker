import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useProject } from "@/lib/project-context";
import { palette, radius } from "@/lib/theme";

/**
 * Shared recovery banner for ST-077: when the project context failed to load,
 * every dependent screen (Dashboard, Log, AI Journal, History) shows this one
 * banner with a Retry that reloads the context in place — no app restart,
 * no sign-out required. Rendered once in the tabs layout.
 */
export function ProjectLoadError() {
  const { error, loading, refresh } = useProject();

  if (!error || loading) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.textWrap}>
        <Text variant="titleSmall" style={styles.title}>
          Couldn't load your projects
        </Text>
        <Text variant="bodySmall" style={styles.detail} numberOfLines={2}>
          {error}
        </Text>
      </View>
      <Button
        mode="contained"
        compact
        onPress={() => refresh()}
        buttonColor={palette.warning}
        textColor={palette.textOnPrimary}
      >
        Retry
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: palette.warningBg,
    borderWidth: 1,
    borderColor: palette.warning,
  },
  textWrap: { flex: 1 },
  title: { color: palette.warning, fontWeight: "700" },
  detail: { color: palette.textSecondary },
});
