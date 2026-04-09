import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getEntryById, EntryRow } from "@/lib/api";

// ── Constants ──

const MOOD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  MANIC: { bg: "#FEF3C7", text: "#92400E", label: "Manic" },
  DEPRESSIVE: { bg: "#DBEAFE", text: "#1E40AF", label: "Depressive" },
  MIXED: { bg: "#EDE9FE", text: "#5B21B6", label: "Mixed" },
  NEUTRAL: { bg: "#F3F4F6", text: "#374151", label: "Neutral" },
};

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
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Entry not found"}</Text>
      </View>
    );
  }

  const mood = displayMood(entry);
  const moodStyle = MOOD_COLORS[mood] ?? MOOD_COLORS.NEUTRAL;
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
      {/* Date */}
      <Text style={styles.date}>{formatDate(entry.date)}</Text>

      {/* Mood badge + day quality */}
      <View style={styles.moodRow}>
        <View style={[styles.moodBadge, { backgroundColor: moodStyle.bg }]}>
          <Text style={[styles.moodBadgeText, { color: moodStyle.text }]}>
            {moodStyle.label}
          </Text>
        </View>
        <Text style={styles.qualityText}>
          {DAY_QUALITY_LABELS[entry.dayQuality] ?? entry.dayQuality}
        </Text>
      </View>

      {/* Indicators */}
      {!hasDetail && (
        <View style={styles.indicatorRow}>
          <Text style={styles.quickLogBadge}>Quick log only</Text>
        </View>
      )}

      {overridden && (
        <View style={styles.indicatorRow}>
          <Text style={styles.overrideText}>
            Reported {MOOD_COLORS[entry.mood]?.label ?? entry.mood} mood
          </Text>
        </View>
      )}

      {entry.computedScore !== null && entry.computedScore !== undefined && (
        <View style={styles.indicatorRow}>
          <Text style={styles.scoreText}>
            Wave score: {entry.computedScore}
          </Text>
        </View>
      )}

      {/* Behaviors */}
      {behaviors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
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
                <View
                  key={key}
                  style={[
                    styles.tag,
                    isManic
                      ? { backgroundColor: "#FEF3C7" }
                      : { backgroundColor: "#DBEAFE" },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      isManic ? { color: "#92400E" } : { color: "#1E40AF" },
                    ]}
                  >
                    {key.replace(/-/g, " ")}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Impairments */}
      {impairments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impairments</Text>
          {impairments.map(([domain, severity]) => (
            <View key={domain} style={styles.impairmentRow}>
              <Text style={styles.impairmentLabel}>
                {IMPAIRMENT_LABELS[domain] ?? domain}
              </Text>
              <View
                style={[
                  styles.severityBadge,
                  severity === "SEVERE"
                    ? styles.severeBadge
                    : styles.presentBadge,
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    severity === "SEVERE"
                      ? styles.severeText
                      : styles.presentText,
                  ]}
                >
                  {severity === "SEVERE" ? "Severe" : "Present"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Missed Medications */}
      {missedMeds.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Missed Medications ({missedMeds.length})
          </Text>
          <View style={styles.tagRow}>
            {missedMeds.map((id) => (
              <View key={id} style={[styles.tag, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.tagText, { color: "#92400E" }]}>
                  {id}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Strategies */}
      {strategies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Strategies ({strategies.length})
          </Text>
          <View style={styles.tagRow}>
            {strategies.map((id) => (
              <View key={id} style={[styles.tag, { backgroundColor: "#D1FAE5" }]}>
                <Text style={[styles.tagText, { color: "#065F46" }]}>
                  {id}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Menstrual */}
      {entry.menstrualSeverity && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menstrual</Text>
          <View style={[styles.tag, { backgroundColor: "#FCE7F3" }]}>
            <Text style={[styles.tagText, { color: "#9D174D" }]}>
              Period: {entry.menstrualSeverity.toLowerCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {entry.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorText: { color: "#DC2626", fontSize: 14 },

  date: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  moodBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodBadgeText: { fontSize: 15, fontWeight: "600" },
  qualityText: { fontSize: 14, color: "#6B7280", marginLeft: 10 },

  indicatorRow: { marginBottom: 6 },
  quickLogBadge: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "500",
  },
  overrideText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  scoreText: {
    fontSize: 13,
    color: "#6B7280",
  },

  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: { fontSize: 13, fontWeight: "500" },

  impairmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  impairmentLabel: { fontSize: 14, color: "#374151" },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presentBadge: { backgroundColor: "#FEF3C7" },
  severeBadge: { backgroundColor: "#FEE2E2" },
  severityText: { fontSize: 12, fontWeight: "600" },
  presentText: { color: "#92400E" },
  severeText: { color: "#991B1B" },

  notesCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
});
