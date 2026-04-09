import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { TenantSummary } from "@/lib/api";
import { palette, radius } from "@/lib/theme";

interface ProjectSelectorProps {
  tenants: TenantSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectSelector({
  tenants,
  selectedId,
  onSelect,
}: ProjectSelectorProps) {
  if (tenants.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.rowContent}
    >
      {tenants.map((t) => {
        const isActive = t.id === selectedId;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={[
              styles.pill,
              isActive && styles.pillActive,
              isActive && t.teenFavoriteColor
                ? { borderColor: t.teenFavoriteColor }
                : undefined,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                isActive && styles.pillTextActive,
              ]}
            >
              {t.teenNickname || t.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { maxHeight: 50 },
  rowContent: { paddingHorizontal: 16, paddingVertical: 5, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.card,
    justifyContent: "center",
    alignItems: "center",
    // Shadow for dimension
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  pillActive: {
    backgroundColor: palette.card,
    borderColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
  pillText: { fontSize: 13, color: palette.textMuted, fontWeight: "500" },
  pillTextActive: { color: palette.primary, fontWeight: "600" },
});
