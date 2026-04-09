import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Text, Chip, ActivityIndicator, Divider, Surface } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { getEntryById, EntryRow } from "@/lib/api";
import { palette, moodColors, radius } from "@/lib/theme";

// ── Constants ──

const DAY_QUALITY_LABELS: Record<string, string> = {
  GOOD: "Good day",
  NEUTRAL: "Neutral day",
  BAD: "Bad day",
  MIXED: "Mixed day",
};

const IMPAIRMENT_LABELS: Record<string, string> = {
  SCHOOL_WORK: "School or work",
  FAMILY_LIFE: "Family life",
  FRIENDSHIPS: "Friendships",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety concern",
};

// ── Helpers ──

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function displayMood(entry: EntryRow): string {
  return entry.computedMood ?? entry.mood;
}

function hasBehaviorDetail(entry: EntryRow): boolean {
  return Array.isArray(entry.behaviorKeys) && entry.behaviorKeys.length > 0;
}

// ── Main Component ──

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<EntryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getEntryById(id);
        setEntry(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load entry");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyMedium" style={styles.errorText}>{error ?? "Entry not found"}</Text>
      </View>
    );
  }

  const mood = displayMood(entry);
  const moodStyle = moodColors[mood] ?? moodColors.NEUTRAL;
  const hasDetail = hasBehaviorDetail(entry);
  const overridden = entry.computedMood && entry.computedMood !== entry.mood;
  const behaviors = entry.behaviorKeys ?? [];
  const impairments = Object.entries(entry.impairments ?? {}).filter(
    ([, v]) => v !== "NONE"
  );
  const missedMeds = entry.missedMedIds ?? [];
  const strategies = entry.strategyIds ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text variant="titleLarge" style={styles.date}>{formatDate(entry.date)}</Text>

      <View style={styles.moodRow}>
        <Chip
          compact
          style={[styles.moodChip, { backgroundColor: moodStyle.bg }]}
          textStyle={[styles.moodChipText, { color: moodStyle.text }]}
        >
          {moodStyle.label}
        </Chip>
        <Text variant="bodyMedium" style={styles.qualityText}>
          {DAY_QUALITY_LABELS[entry.dayQuality] ?? entry.dayQuality}
        </Text>
      </View>

      {!hasDetail && (
        <View style={styles.indicatorRow}>
          <Text variant="bodySmall" style={styles.quickLogBadge}>Quick log only</Text>
        </View>
      )}

      {overridden && (
        <View style={styles.indicatorRow}>
          <Text variant="bodySmall" style={styles.overrideText}>
            Reported {moodColors[entry.mood]?.label ?? entry.mood} mood
          </Text>
        </View>
      )}

      {entry.computedScore !== null && entry.computedScore !== undefined && (
        <View style={styles.indicatorRow}>
          <Text variant="bodySmall" style={styles.scoreText}>
            Wave score: {entry.computedScore}
          </Text>
        </View>
      )}

      {behaviors.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Behaviors ({behaviors.length})
          </Text>
          <View style={styles.tagRow}>
            {behaviors.map((key) => {
              const isManic = [
                "elevated-expansive-irritable-mood",
                "inflated-self-image",
                "decreased-need-for-sleep",
                "pressured-speech",
                "racing-thoughts",
                "distractibility",
                "goal-directed-activity",
                "risky-reckless-activities",
              ].includes(key);
              return (
                <Chip
                  key={key}
                  compact
                  style={[
                    styles.behaviorChip,
                    isManic
                      ? { backgroundColor: moodColors.MANIC.bg }
                      : { backgroundColor: moodColors.DEPRESSIVE.bg },
                  ]}
                  textStyle={[
                    styles.behaviorChipText,
                    isManic ? { color: moodColors.MANIC.text } : { color: moodColors.DEPRESSIVE.text },
                  ]}
                >
                  {key.replace(/-/g, " ")}
                </Chip>
              );
            })}
          </View>
        </View>
      )}

      {impairments.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Impairments</Text>
          {impairments.map(([domain, severity]) => (
            <View key={domain}>
              <View style={styles.impairmentRow}>
                <Text variant="bodyMedium" style={styles.impairmentLabel}>
                  {IMPAIRMENT_LABELS[domain] ?? domain}
                </Text>
                <Chip
                  compact
                  style={[
                    styles.severityChip,
                    severity === "SEVERE"
                      ? { backgroundColor: palette.errorBg }
                      : { backgroundColor: palette.warningBg },
                  ]}
                  textStyle={[
                    styles.severityChipText,
                    severity === "SEVERE"
                      ? { color: palette.error }
                      : { color: palette.warning },
                  ]}
                >
                  {severity === "SEVERE" ? "Severe" : "Present"}
                </Chip>
              </View>
              <Divider style={styles.impairmentDivider} />
            </View>
          ))}
        </View>
      )}

      {missedMeds.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Missed Medications ({missedMeds.length})
          </Text>
          <View style={styles.tagRow}>
            {missedMeds.map((id) => (
              <Chip
                key={id}
                compact
                style={[styles.behaviorChip, { backgroundColor: palette.warningBg }]}
                textStyle={[styles.behaviorChipText, { color: palette.warning }]}
              >
                {id}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {strategies.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Strategies ({strategies.length})
          </Text>
          <View style={styles.tagRow}>
            {strategies.map((id) => (
              <Chip
                key={id}
                compact
                style={[styles.behaviorChip, { backgroundColor: palette.secondaryFaint }]}
                textStyle={[styles.behaviorChipText, { color: "#065F46" }]}
              >
                {id}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {entry.menstrualSeverity && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Menstrual</Text>
          <Chip
            compact
            style={[styles.behaviorChip, { backgroundColor: "#FCE7F3" }]}
            textStyle={[styles.behaviorChipText, { color: "#9D174D" }]}
          >
            Period: {entry.menstrualSeverity.toLowerCase()}
          </Chip>
        </View>
      )}

      {entry.notes && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Notes</Text>
          <Surface style={styles.notesCard} elevation={2}>
            <Text variant="bodyMedium" style={styles.notesText}>{entry.notes}</Text>
          </Surface>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
  },
  errorText: { color: palette.error },

  date: {
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 12,
  },

  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  moodChip: {
    borderRadius: radius.sm,
  },
  moodChipText: { fontSize: 15, fontWeight: "600" },
  qualityText: { color: palette.textSecondary, marginLeft: 10 },

  indicatorRow: { marginBottom: 6 },
  quickLogBadge: {
    color: palette.warning,
    fontWeight: "500",
  },
  overrideText: {
    color: palette.textSecondary,
    fontStyle: "italic",
  },
  scoreText: {
    color: palette.textSecondary,
  },

  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: "700",
    color: palette.textSecondary,
    marginBottom: 8,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  behaviorChip: {
    borderRadius: radius.sm,
  },
  behaviorChipText: { fontSize: 13, fontWeight: "500" },

  impairmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  impairmentLabel: { color: palette.textSecondary },
  severityChip: {
    borderRadius: radius.sm,
  },
  severityChipText: { fontSize: 12, fontWeight: "600" },
  impairmentDivider: {
    backgroundColor: palette.borderLight,
  },

  notesCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 14,
  },
  notesText: {
    color: palette.textSecondary,
    lineHeight: 22,
  },
});
