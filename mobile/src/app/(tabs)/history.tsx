import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Text, Card, Chip, ActivityIndicator, Divider, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  getEntriesByRange,
  EntryRow,
} from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { palette, moodColors, radius } from "@/lib/theme";

// ── Constants ──

const DAY_QUALITY_LABELS: Record<string, string> = {
  GOOD: "Good day",
  NEUTRAL: "Neutral day",
  BAD: "Bad day",
  MIXED: "Mixed day",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const IMPAIRMENT_LABELS: Record<string, string> = {
  SCHOOL_WORK: "School/Work",
  FAMILY_LIFE: "Family",
  FRIENDSHIPS: "Friends",
  SELF_CARE: "Self-care",
  SAFETY_CONCERN: "Safety",
};

// ── Date helpers ──

function todayParts(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

function monthRange(
  year: number,
  month: number
): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function calendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateFull(ds: string): string {
  const d = new Date(ds + "T12:00:00");
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

export default function HistoryScreen() {
  const { selectedTenant: activeTenant, tenants, loading: projectLoading } = useProject();
  const [year, setYear] = useState(todayParts().year);
  const [month, setMonth] = useState(todayParts().month);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!activeTenant) {
      if (!projectLoading) setLoading(false);
      return;
    }
    try {
      const { start, end } = monthRange(year, month);
      const data = await getEntriesByRange(activeTenant.id, start, end);
      setEntries(data);
    } catch (e) {
      console.error("Failed to load entries:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTenant?.id, year, month]);

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    loadEntries();
  }, [loadEntries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries();
  }, [loadEntries]);

  const entriesByDay = useMemo(() => {
    const map = new Map<number, EntryRow[]>();
    for (const entry of entries) {
      const day = parseInt(entry.date.split("-")[2], 10);
      const list = map.get(day) ?? [];
      list.push(entry);
      map.set(day, list);
    }
    return map;
  }, [entries]);

  const weeks = useMemo(() => calendarGrid(year, month), [year, month]);

  const selectedEntries = selectedDay
    ? entriesByDay.get(selectedDay) ?? []
    : [];

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    const today = todayParts();
    if (year === today.year && month >= today.month) return;
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  const isCurrentMonth =
    year === todayParts().year && month === todayParts().month;

  if ((loading || projectLoading) && entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text variant="headlineSmall" style={styles.pageTitle}>
          History
        </Text>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
            <Text variant="headlineMedium" style={styles.monthArrowText}>
              ‹
            </Text>
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.monthLabel}>
            {monthLabel(year, month)}
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={styles.monthArrow}
            disabled={isCurrentMonth}
          >
            <Text
              variant="headlineMedium"
              style={[
                styles.monthArrowText,
                isCurrentMonth && styles.monthArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <Surface style={styles.calendar} elevation={2}>
          <View style={styles.calendarRow}>
            {DAY_NAMES.map((name) => (
              <View key={name} style={styles.calendarHeaderCell}>
                <Text variant="labelSmall" style={styles.dayHeaderText}>
                  {name}
                </Text>
              </View>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.calendarRow}>
              {week.map((day, di) => {
                if (day === null) {
                  return <View key={di} style={styles.calendarCell} />;
                }
                const dayEntries = entriesByDay.get(day);
                const hasEntries = !!dayEntries && dayEntries.length > 0;
                const isSelected = selectedDay === day;

                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                    ]}
                    onPress={() => setSelectedDay(isSelected ? null : day)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        hasEntries && styles.dayNumberBold,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasEntries && (
                      <View style={styles.dotRow}>
                        {dayEntries.map((e) => {
                          const m = displayMood(e);
                          const color =
                            moodColors[m]?.dot ?? moodColors.NEUTRAL.dot;
                          return (
                            <View
                              key={e.id}
                              style={[styles.moodDot, { backgroundColor: color }]}
                            />
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Surface>

        {/* Selected day detail */}
        {selectedDay !== null && (
          <View style={styles.detailSection}>
            <Divider style={{ marginBottom: 12, backgroundColor: palette.borderLight }} />
            <Text variant="titleMedium" style={styles.detailDate}>
              {formatDateFull(dateStr(year, month, selectedDay))}
            </Text>

            {selectedEntries.length === 0 ? (
              <Text variant="bodySmall" style={styles.noEntries}>
                No entries logged
              </Text>
            ) : (
              selectedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Entry Card ──

function EntryCard({ entry }: { entry: EntryRow }) {
  const router = useRouter();
  const mood = displayMood(entry);
  const moodStyle = moodColors[mood] ?? moodColors.NEUTRAL;
  const hasDetail = hasBehaviorDetail(entry);
  const overridden = entry.computedMood && entry.computedMood !== entry.mood;

  const activeImpairments = Object.entries(entry.impairments ?? {}).filter(
    ([, v]) => v !== "NONE"
  );
  const missedMeds = entry.missedMedIds ?? [];
  const behaviors = entry.behaviorKeys ?? [];

  return (
    <Surface style={styles.card} elevation={2}>
      <Card
        style={styles.cardInner}
        onPress={() => router.push(`/entry/${entry.id}`)}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Chip
              compact
              textStyle={{ fontSize: 12, color: moodStyle.text }}
              style={[styles.moodChip, { backgroundColor: moodStyle.bg }]}
            >
              {moodStyle.label}
            </Chip>
            <Text variant="bodySmall" style={styles.qualityText}>
              {DAY_QUALITY_LABELS[entry.dayQuality] ?? entry.dayQuality}
            </Text>
          </View>

          {!hasDetail && (
            <Text variant="labelSmall" style={styles.quickLogBadge}>
              Quick log only
            </Text>
          )}

          {overridden && (
            <Text variant="labelSmall" style={styles.overrideText}>
              Reported {moodColors[entry.mood]?.label ?? entry.mood} mood
            </Text>
          )}

          {behaviors.length > 0 && (
            <View style={styles.tagSection}>
              <Text variant="labelSmall" style={styles.tagLabel}>
                Behaviors
              </Text>
              <View style={styles.tagRow}>
                {behaviors.map((key) => (
                  <Chip
                    key={key}
                    compact
                    textStyle={styles.tagChipText}
                    style={styles.tagChip}
                  >
                    {key.replace(/-/g, " ")}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {activeImpairments.length > 0 && (
            <View style={styles.tagSection}>
              <Text variant="labelSmall" style={styles.tagLabel}>
                Impairments
              </Text>
              <View style={styles.tagRow}>
                {activeImpairments.map(([domain, severity]) => (
                  <Chip
                    key={domain}
                    compact
                    textStyle={[
                      styles.tagChipText,
                      severity === "SEVERE" && { color: palette.error },
                    ]}
                    style={[
                      styles.tagChip,
                      severity === "SEVERE" && { backgroundColor: palette.errorBg },
                    ]}
                  >
                    {IMPAIRMENT_LABELS[domain] ?? domain}: {severity.toLowerCase()}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {missedMeds.length > 0 && (
            <View style={styles.tagSection}>
              <Text variant="labelSmall" style={styles.tagLabel}>
                Missed medications ({missedMeds.length})
              </Text>
            </View>
          )}

          {entry.menstrualSeverity && (
            <View style={styles.tagSection}>
              <Chip
                compact
                textStyle={{ fontSize: 11, color: "#9D174D" }}
                style={[styles.moodChip, { backgroundColor: "#FCE7F3" }]}
              >
                Period: {entry.menstrualSeverity.toLowerCase()}
              </Chip>
            </View>
          )}

          {entry.notes && (
            <View style={styles.notesSection}>
              <Text variant="labelSmall" style={styles.tagLabel}>
                Notes
              </Text>
              <Text variant="bodySmall" style={styles.notesText} numberOfLines={4}>
                {entry.notes}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </Surface>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  pageTitle: {
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 12,
  },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  monthArrow: { padding: 8 },
  monthArrowText: { color: palette.primary, fontWeight: "300" },
  monthArrowDisabled: { color: palette.textMuted },
  monthLabel: { fontWeight: "700", color: palette.textPrimary },

  // Calendar
  calendar: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 8,
    marginBottom: 16,
  },
  calendarRow: { flexDirection: "row" },
  calendarHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayHeaderText: { color: palette.textMuted },
  calendarCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: radius.sm,
  },
  calendarCellSelected: {
    backgroundColor: palette.primaryFaint,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  dayNumber: { fontSize: 14, color: palette.textMuted },
  dayNumberBold: { fontWeight: "700", color: palette.textPrimary },
  dayNumberSelected: { color: palette.primary },
  dotRow: {
    flexDirection: "row",
    marginTop: 2,
    gap: 3,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Detail section
  detailSection: { marginTop: 4 },
  detailDate: {
    fontWeight: "600",
    color: palette.textPrimary,
    marginBottom: 12,
  },
  noEntries: { color: palette.textMuted, fontStyle: "italic" },

  // Entry card
  card: {
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: palette.card,
  },
  cardInner: { backgroundColor: "transparent" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moodChip: { borderRadius: radius.sm },
  qualityText: { color: palette.textSecondary, marginLeft: 8 },
  quickLogBadge: {
    color: palette.warning,
    fontWeight: "500",
    marginBottom: 6,
  },
  overrideText: {
    color: palette.textSecondary,
    fontStyle: "italic",
    marginBottom: 6,
  },

  // Tags
  tagSection: { marginTop: 8 },
  tagLabel: {
    fontWeight: "600",
    color: palette.textSecondary,
    marginBottom: 4,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: {
    backgroundColor: palette.borderLight,
    borderRadius: radius.sm,
  },
  tagChipText: { fontSize: 11, color: palette.textSecondary },

  // Notes
  notesSection: { marginTop: 8 },
  notesText: { color: palette.textSecondary, lineHeight: 20 },
});
