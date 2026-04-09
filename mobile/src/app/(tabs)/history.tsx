import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Text, Card, Chip, ActivityIndicator, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  getTenants,
  getCurrentUserInfo,
  getEntriesByRange,
  TenantSummary,
  EntryRow,
} from "@/lib/api";

// ── Constants ──

const MOOD_COLORS: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  MANIC: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "Manic" },
  DEPRESSIVE: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    dot: "#3B82F6",
    label: "Depressive",
  },
  MIXED: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6", label: "Mixed" },
  NEUTRAL: { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF", label: "Neutral" },
};

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
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenant, setActiveTenant] = useState<TenantSummary | null>(null);
  const [year, setYear] = useState(todayParts().year);
  const [month, setMonth] = useState(todayParts().month);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load tenants with default project support
  useEffect(() => {
    (async () => {
      try {
        const [t, user] = await Promise.all([getTenants(), getCurrentUserInfo()]);
        setTenants(t);
        if (t.length > 0) {
          const defaultId = user?.defaultTenantId;
          const hasDefault = defaultId && t.some((tenant) => tenant.id === defaultId);
          setActiveTenant(hasDefault ? t.find((tenant) => tenant.id === defaultId)! : t[0]);
        }
      } catch (e) {
        console.error("Failed to load tenants:", e);
      }
    })();
  }, []);

  // Load entries for month
  const loadEntries = useCallback(async () => {
    if (!activeTenant) {
      setLoading(false);
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

  // Map entries by day number
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

  // Selected day entries
  const selectedEntries = selectedDay
    ? entriesByDay.get(selectedDay) ?? []
    : [];

  // Month navigation
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

  // ── Render ──

  if (loading && entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (tenants.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No projects found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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

        {/* Project selector */}
        {tenants.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tenantBar}
            contentContainerStyle={{ gap: 8 }}
          >
            {tenants.map((t) => {
              const isActive = activeTenant?.id === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.projectPill,
                    isActive && styles.projectPillActive,
                    isActive && t.teenFavoriteColor
                      ? { borderColor: t.teenFavoriteColor }
                      : undefined,
                  ]}
                  onPress={() => setActiveTenant(t)}
                >
                  <Text
                    style={[
                      styles.projectPillText,
                      isActive && styles.projectPillTextActive,
                    ]}
                  >
                    {t.teenNickname ?? t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

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
        <View style={styles.calendar}>
          {/* Day headers */}
          <View style={styles.calendarRow}>
            {DAY_NAMES.map((name) => (
              <View key={name} style={styles.calendarHeaderCell}>
                <Text variant="labelSmall" style={styles.dayHeaderText}>
                  {name}
                </Text>
              </View>
            ))}
          </View>

          {/* Weeks */}
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
                            MOOD_COLORS[m]?.dot ?? MOOD_COLORS.NEUTRAL.dot;
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
        </View>

        {/* Selected day detail */}
        {selectedDay !== null && (
          <View style={styles.detailSection}>
            <Divider style={{ marginBottom: 12 }} />
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
    </SafeAreaView>
  );
}

// ── Entry Card ──

function EntryCard({ entry }: { entry: EntryRow }) {
  const router = useRouter();
  const mood = displayMood(entry);
  const moodStyle = MOOD_COLORS[mood] ?? MOOD_COLORS.NEUTRAL;
  const hasDetail = hasBehaviorDetail(entry);
  const overridden = entry.computedMood && entry.computedMood !== entry.mood;

  const activeImpairments = Object.entries(entry.impairments ?? {}).filter(
    ([, v]) => v !== "NONE"
  );
  const missedMeds = entry.missedMedIds ?? [];
  const behaviors = entry.behaviorKeys ?? [];

  return (
    <Card
      style={styles.card}
      onPress={() => router.push(`/entry/${entry.id}`)}
      mode="contained"
    >
      <Card.Content>
        {/* Mood badge + meta */}
        <View style={styles.cardHeader}>
          <Chip
            compact
            textStyle={{ fontSize: 12, color: moodStyle.text }}
            style={{ backgroundColor: moodStyle.bg }}
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
            Reported {MOOD_COLORS[entry.mood]?.label ?? entry.mood} mood
          </Text>
        )}

        {/* Behaviors */}
        {behaviors.length > 0 && (
          <View style={styles.tagSection}>
            <Text variant="labelSmall" style={styles.tagLabel}>
              Behaviors
            </Text>
            <View style={styles.tagRow}>
              {behaviors.map((key) => (
                <Chip key={key} compact textStyle={styles.tagChipText} style={styles.tagChip}>
                  {key.replace(/-/g, " ")}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Impairments */}
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
                    severity === "SEVERE" && { color: "#991B1B" },
                  ]}
                  style={[
                    styles.tagChip,
                    severity === "SEVERE" && { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  {IMPAIRMENT_LABELS[domain] ?? domain}: {severity.toLowerCase()}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Missed meds */}
        {missedMeds.length > 0 && (
          <View style={styles.tagSection}>
            <Text variant="labelSmall" style={styles.tagLabel}>
              Missed medications ({missedMeds.length})
            </Text>
          </View>
        )}

        {/* Menstrual */}
        {entry.menstrualSeverity && (
          <View style={styles.tagSection}>
            <Chip
              compact
              textStyle={{ fontSize: 11, color: "#9D174D" }}
              style={{ backgroundColor: "#FCE7F3", alignSelf: "flex-start" }}
            >
              Period: {entry.menstrualSeverity.toLowerCase()}
            </Chip>
          </View>
        )}

        {/* Notes */}
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
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6B7280" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  pageTitle: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  // Project selector (matches dashboard)
  tenantBar: { marginBottom: 16 },
  projectPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  projectPillActive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#374151",
  },
  projectPillText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  projectPillTextActive: { color: "#111827", fontWeight: "600" },

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
  monthArrowText: { color: "#374151", fontWeight: "300" },
  monthArrowDisabled: { color: "#D1D5DB" },
  monthLabel: { fontWeight: "700", color: "#111827" },

  // Calendar
  calendar: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  calendarRow: { flexDirection: "row" },
  calendarHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayHeaderText: { color: "#9CA3AF" },
  calendarCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 8,
  },
  calendarCellSelected: {
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#374151",
  },
  dayNumber: { fontSize: 14, color: "#9CA3AF" },
  dayNumberBold: { fontWeight: "700", color: "#111827" },
  dayNumberSelected: { color: "#111827" },
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
    color: "#111827",
    marginBottom: 12,
  },
  noEntries: { color: "#9CA3AF", fontStyle: "italic" },

  // Entry card
  card: {
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  qualityText: { color: "#6B7280", marginLeft: 8 },
  quickLogBadge: {
    color: "#D97706",
    fontWeight: "500",
    marginBottom: 6,
  },
  overrideText: {
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 6,
  },

  // Tags
  tagSection: { marginTop: 8 },
  tagLabel: {
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: {
    backgroundColor: "#E5E7EB",
  },
  tagChipText: { fontSize: 11, color: "#374151" },

  // Notes
  notesSection: { marginTop: 8 },
  notesText: { color: "#374151", lineHeight: 20 },
});
