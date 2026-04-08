import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getTenants,
  getEntriesByRange,
  TenantSummary,
  EntryRow,
} from "@/lib/api";

// ── Constants ──

const MOOD_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  MANIC: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "Manic" },
  DEPRESSIVE: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6", label: "Depressive" },
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

function monthRange(year: number, month: number): { start: string; end: string } {
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

  // Load tenants
  useEffect(() => {
    (async () => {
      try {
        const t = await getTenants();
        setTenants(t);
        if (t.length > 0) setActiveTenant(t[0]);
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
  const selectedEntries = selectedDay ? entriesByDay.get(selectedDay) ?? [] : [];

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
          <ActivityIndicator size="large" color="#374151" />
        </View>
      </SafeAreaView>
    );
  }

  if (tenants.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No projects found</Text>
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
        <Text style={styles.pageTitle}>History</Text>

        {/* Project selector */}
        {tenants.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tenantBar}
          >
            {tenants.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tenantPill,
                  activeTenant?.id === t.id && styles.tenantPillActive,
                ]}
                onPress={() => setActiveTenant(t)}
              >
                {t.teenFavoriteColor && (
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: t.teenFavoriteColor },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.tenantPillText,
                    activeTenant?.id === t.id && styles.tenantPillTextActive,
                  ]}
                >
                  {t.teenNickname ?? t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={styles.monthArrow}
            disabled={isCurrentMonth}
          >
            <Text
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
                <Text style={styles.dayHeaderText}>{name}</Text>
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
            <Text style={styles.detailDate}>
              {formatDateFull(dateStr(year, month, selectedDay))}
            </Text>

            {selectedEntries.length === 0 ? (
              <Text style={styles.noEntries}>No entries logged</Text>
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
  const mood = displayMood(entry);
  const moodStyle = MOOD_COLORS[mood] ?? MOOD_COLORS.NEUTRAL;
  const hasDetail = hasBehaviorDetail(entry);
  const overridden =
    entry.computedMood && entry.computedMood !== entry.mood;

  const activeImpairments = Object.entries(entry.impairments ?? {}).filter(
    ([, v]) => v !== "NONE"
  );
  const missedMeds = entry.missedMedIds ?? [];
  const behaviors = entry.behaviorKeys ?? [];

  return (
    <View style={styles.card}>
      {/* Mood badge + meta */}
      <View style={styles.cardHeader}>
        <View style={[styles.moodBadge, { backgroundColor: moodStyle.bg }]}>
          <Text style={[styles.moodBadgeText, { color: moodStyle.text }]}>
            {moodStyle.label}
          </Text>
        </View>
        <Text style={styles.qualityText}>
          {DAY_QUALITY_LABELS[entry.dayQuality] ?? entry.dayQuality}
        </Text>
      </View>

      {!hasDetail && (
        <Text style={styles.quickLogBadge}>Quick log only</Text>
      )}

      {overridden && (
        <Text style={styles.overrideText}>
          Reported {MOOD_COLORS[entry.mood]?.label ?? entry.mood} mood
        </Text>
      )}

      {/* Behaviors */}
      {behaviors.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Behaviors</Text>
          <View style={styles.tagRow}>
            {behaviors.map((key) => (
              <View key={key} style={styles.tag}>
                <Text style={styles.tagText}>
                  {key.replace(/-/g, " ")}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Impairments */}
      {activeImpairments.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Impairments</Text>
          <View style={styles.tagRow}>
            {activeImpairments.map(([domain, severity]) => (
              <View
                key={domain}
                style={[
                  styles.tag,
                  severity === "SEVERE" && styles.tagSevere,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    severity === "SEVERE" && styles.tagTextSevere,
                  ]}
                >
                  {IMPAIRMENT_LABELS[domain] ?? domain}: {severity.toLowerCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Missed meds */}
      {missedMeds.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>
            Missed medications ({missedMeds.length})
          </Text>
        </View>
      )}

      {/* Menstrual */}
      {entry.menstrualSeverity && (
        <View style={styles.tagSection}>
          <View style={[styles.tag, { backgroundColor: "#FCE7F3" }]}>
            <Text style={[styles.tagText, { color: "#9D174D" }]}>
              Period: {entry.menstrualSeverity.toLowerCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {entry.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.tagLabel}>Notes</Text>
          <Text style={styles.notesText} numberOfLines={4}>
            {entry.notes}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6B7280", fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  // Tenant selector
  tenantBar: { marginBottom: 16 },
  tenantPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tenantPillActive: {
    backgroundColor: "#E5E7EB",
    borderColor: "#374151",
  },
  tenantPillText: { fontSize: 14, color: "#6B7280" },
  tenantPillTextActive: { color: "#111827", fontWeight: "600" },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

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
  monthArrowText: { fontSize: 28, color: "#374151", fontWeight: "300" },
  monthArrowDisabled: { color: "#D1D5DB" },
  monthLabel: { fontSize: 18, fontWeight: "700", color: "#111827" },

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
  dayHeaderText: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
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
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  noEntries: { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },

  // Entry card
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: { fontSize: 13, fontWeight: "600" },
  qualityText: { fontSize: 13, color: "#6B7280", marginLeft: 8 },
  quickLogBadge: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
    marginBottom: 6,
  },
  overrideText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 6,
  },

  // Tags
  tagSection: { marginTop: 8 },
  tagLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagSevere: { backgroundColor: "#FEE2E2" },
  tagText: { fontSize: 12, color: "#374151" },
  tagTextSevere: { color: "#991B1B" },

  // Notes
  notesSection: { marginTop: 8 },
  notesText: { fontSize: 13, color: "#374151", lineHeight: 20 },
});
