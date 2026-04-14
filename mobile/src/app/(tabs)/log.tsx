import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Text, ActivityIndicator, Button, Surface } from "react-native-paper";
import {
  getFrameworkId,
  getBehaviorCategories,
  getBehaviorDefinitions,
  getCustomItems,
  getActiveMedications,
  getStrategies,
  getEntryByDate,
  saveEntry,
  BehaviorCategoryRow,
  BehaviorDefinitionRow,
  CustomItemRow,
  MedicationRow,
  StrategyRow,
  EntryRow,
} from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { palette, moodColors, radius } from "@/lib/theme";

// ── Constants ──

const MOODS = [
  { value: "MANIC", label: "Manic", bg: moodColors.MANIC.bg, text: moodColors.MANIC.text },
  { value: "DEPRESSIVE", label: "Depressive", bg: moodColors.DEPRESSIVE.bg, text: moodColors.DEPRESSIVE.text },
  { value: "NEUTRAL", label: "Neutral", bg: moodColors.NEUTRAL.bg, text: moodColors.NEUTRAL.text },
  { value: "MIXED", label: "Mixed", bg: moodColors.MIXED.bg, text: moodColors.MIXED.text },
];

const DAY_QUALITIES = [
  { value: "GOOD", label: "Good", bg: palette.secondaryFaint, text: "#065F46" },
  { value: "NEUTRAL", label: "Neutral", bg: moodColors.NEUTRAL.bg, text: palette.textSecondary },
  { value: "BAD", label: "Bad", bg: palette.errorBg, text: palette.error },
  { value: "MIXED", label: "Mixed", bg: moodColors.MIXED.bg, text: moodColors.MIXED.text },
];

const IMPAIRMENT_DOMAINS = [
  { key: "SCHOOL_WORK", label: "School or work" },
  { key: "FAMILY_LIFE", label: "Family life" },
  { key: "FRIENDSHIPS", label: "Friendships" },
  { key: "SELF_CARE", label: "Self-care" },
  { key: "SAFETY_CONCERN", label: "Safety concern" },
];

const IMPAIRMENT_LEVELS = ["NONE", "PRESENT", "SEVERE"] as const;

const MENSTRUAL_OPTIONS = [
  { value: "LIGHT", label: "Light" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HEAVY", label: "Heavy" },
];

const POLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  manic: { bg: moodColors.MANIC.bg, text: moodColors.MANIC.text, dot: moodColors.MANIC.dot },
  depressive: { bg: moodColors.DEPRESSIVE.bg, text: moodColors.DEPRESSIVE.text, dot: moodColors.DEPRESSIVE.dot },
};

// ── Helpers ──

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseExamples(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Main Component ──

export default function LogScreen() {
  const { selectedTenant: activeTenant, loading: projectLoading } = useProject();

  // Form state
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState("NEUTRAL");
  const [dayQuality, setDayQuality] = useState("NEUTRAL");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const [checkedCustom, setCheckedCustom] = useState<Set<string>>(new Set());
  const [checkedStrategies, setCheckedStrategies] = useState<Set<string>>(new Set());
  const [missedMeds, setMissedMeds] = useState<Set<string>>(new Set());
  const [impairments, setImpairments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [menstrual, setMenstrual] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<BehaviorCategoryRow[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorDefinitionRow[]>([]);
  const [customItems, setCustomItems] = useState<CustomItemRow[]>([]);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [strategyList, setStrategyList] = useState<StrategyRow[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<EntryRow | null>(null);
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeTenant) {
      if (!projectLoading) setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const fwId = await getFrameworkId(activeTenant.id);

        const [customRes, medRes, stratRes] = await Promise.all([
          getCustomItems(activeTenant.id),
          getActiveMedications(activeTenant.id),
          getStrategies(activeTenant.id),
        ]);

        if (cancelled) return;
        setCustomItems(customRes);
        setMedications(medRes);
        setStrategyList(stratRes);

        if (fwId) {
          const cats = await getBehaviorCategories(fwId);
          if (cancelled) return;
          setCategories(cats);

          if (cats.length > 0) {
            const defs = await getBehaviorDefinitions(cats.map((c) => c.id));
            if (cancelled) return;
            setBehaviors(defs);
          }
        }
      } catch (e) {
        console.error("Failed to load form data:", e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTenant?.id]);

  useEffect(() => {
    if (!activeTenant) return;
    let cancelled = false;

    (async () => {
      try {
        const entry = await getEntryByDate(activeTenant.id, date);
        if (cancelled) return;
        setExistingEntry(entry);
        if (entry) {
          setMood(entry.mood);
          setDayQuality(entry.dayQuality);
          setCheckedBehaviors(new Set(entry.behaviorKeys ?? []));
          setCheckedCustom(new Set(entry.customItemIds ?? []));
          setCheckedStrategies(new Set(entry.strategyIds ?? []));
          setMissedMeds(new Set(entry.missedMedIds ?? []));
          setImpairments(entry.impairments ?? {});
          setNotes(entry.notes ?? "");
          setMenstrual(entry.menstrualSeverity ?? null);
        } else {
          resetForm();
        }
      } catch (e) {
        console.error("Failed to check existing entry:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTenant?.id, date]);

  function resetForm() {
    setMood("NEUTRAL");
    setDayQuality("NEUTRAL");
    setCheckedBehaviors(new Set());
    setCheckedCustom(new Set());
    setCheckedStrategies(new Set());
    setMissedMeds(new Set());
    setImpairments({});
    setNotes("");
    setMenstrual(null);
    setExpandedExamples(new Set());
  }

  const behaviorsByCategory = useMemo(() => {
    const map = new Map<string, BehaviorDefinitionRow[]>();
    for (const b of behaviors) {
      const list = map.get(b.categoryId) ?? [];
      list.push(b);
      map.set(b.categoryId, list);
    }
    return map;
  }, [behaviors]);

  function toggleSet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSection(key: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const handleSave = useCallback(async () => {
    if (!activeTenant) return;
    setSaving(true);
    try {
      await saveEntry({
        tenantId: activeTenant.id,
        mood,
        dayQuality,
        behaviorKeys: Array.from(checkedBehaviors),
        customItemIds: Array.from(checkedCustom),
        strategyIds: Array.from(checkedStrategies),
        missedMedIds: Array.from(missedMeds),
        impairments,
        notes: notes.trim() || undefined,
        menstrualSeverity: menstrual,
        date,
      });
      Alert.alert(
        existingEntry ? "Entry Updated" : "Entry Saved",
        `Log for ${formatDateDisplay(date)} saved successfully.`
      );
      const updated = await getEntryByDate(activeTenant.id, date);
      setExistingEntry(updated);
    } catch (e) {
      Alert.alert("Save Failed", "Could not save the entry. Please try again.");
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }, [
    activeTenant,
    mood,
    dayQuality,
    checkedBehaviors,
    checkedCustom,
    checkedStrategies,
    missedMeds,
    impairments,
    notes,
    menstrual,
    date,
    existingEntry,
  ]);

  if (loading || projectLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text variant="bodySmall" style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.pageTitle}>Daily Log</Text>

        {/* Date selector */}
        <Surface style={styles.dateRow} elevation={3}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => setDate(shiftDate(date, -1))}
          >
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text variant="titleMedium" style={styles.dateText}>{formatDateDisplay(date)}</Text>
            {existingEntry && (
              <Text variant="labelSmall" style={styles.existingBadge}>Editing existing entry</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => {
              if (date < todayStr()) setDate(shiftDate(date, 1));
            }}
            disabled={date >= todayStr()}
          >
            <Text
              style={[
                styles.dateArrowText,
                date >= todayStr() && styles.dateArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Quick Log — Mood */}
        <SectionHeader title="Overall Mood" />
        <View style={styles.pillRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.pill,
                mood === m.value
                  ? { backgroundColor: m.bg, borderColor: m.text }
                  : styles.pillInactive,
              ]}
              onPress={() => setMood(m.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  mood === m.value ? { color: m.text } : styles.pillTextInactive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Log — Day Quality */}
        <SectionHeader title="Day Quality" />
        <View style={styles.pillRow}>
          {DAY_QUALITIES.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={[
                styles.pill,
                dayQuality === q.value
                  ? { backgroundColor: q.bg, borderColor: q.text }
                  : styles.pillInactive,
              ]}
              onPress={() => setDayQuality(q.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  dayQuality === q.value
                    ? { color: q.text }
                    : styles.pillTextInactive,
                ]}
              >
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Behavior Checklist — retry banner if load failed */}
        {loadError && categories.length === 0 && (
          <Surface style={styles.errorBanner} elevation={2}>
            <Text variant="bodySmall" style={styles.errorBannerText}>
              Behavior checklist failed to load.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                // Re-trigger the useEffect by toggling a counter
                setLoadError(false);
                setCategories([]);
                setBehaviors([]);
                setLoading(true);
                // Force re-run by setting loading — the effect will re-run
                // because we clear categories, but we need the effect to re-fire.
                // Simplest: just call the load inline.
                (async () => {
                  try {
                    const fwId = await getFrameworkId(activeTenant!.id);
                    if (fwId) {
                      const cats = await getBehaviorCategories(fwId);
                      setCategories(cats);
                      if (cats.length > 0) {
                        const defs = await getBehaviorDefinitions(cats.map((c) => c.id));
                        setBehaviors(defs);
                      }
                    }
                  } catch (e) {
                    console.error("Retry failed:", e);
                    setLoadError(true);
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Surface>
        )}

        {categories.map((cat) => {
          const pole = POLE_COLORS[cat.slug] ?? POLE_COLORS.manic;
          const defs = behaviorsByCategory.get(cat.id) ?? [];
          const isCollapsed = collapsedSections.has(`behavior-${cat.slug}`);

          return (
            <View key={cat.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => toggleSection(`behavior-${cat.slug}`)}
              >
                <Text variant="titleSmall" style={styles.sectionTitle}>{cat.name} Criteria</Text>
                <Text variant="bodySmall" style={styles.chevron}>{isCollapsed ? "▸" : "▾"}</Text>
                {checkedBehaviors.size > 0 && (
                  <Text variant="labelSmall" style={[styles.countBadge, { backgroundColor: pole.bg, color: pole.text }]}>
                    {defs.filter((d) => checkedBehaviors.has(d.itemKey)).length}
                  </Text>
                )}
              </TouchableOpacity>

              {!isCollapsed &&
                defs.map((def) => {
                  const checked = checkedBehaviors.has(def.itemKey);
                  const examples = parseExamples(def.recognitionExamples);
                  const isExpanded = expandedExamples.has(def.itemKey);

                  return (
                    <View key={def.id} style={styles.behaviorItem}>
                      <TouchableOpacity
                        style={[
                          styles.behaviorPill,
                          checked
                            ? { backgroundColor: pole.bg, borderColor: pole.dot }
                            : styles.pillInactive,
                        ]}
                        onPress={() =>
                          toggleSet(setCheckedBehaviors, def.itemKey)
                        }
                      >
                        <Text
                          style={[
                            styles.behaviorPillText,
                            checked
                              ? { color: pole.text }
                              : styles.pillTextInactive,
                          ]}
                        >
                          {def.label}
                        </Text>
                        {def.isSafetyConcern && (
                          <Text style={styles.safetyBadge}>⚠</Text>
                        )}
                      </TouchableOpacity>

                      {examples.length > 0 && (
                        <TouchableOpacity
                          style={styles.examplesToggle}
                          onPress={() =>
                            toggleSet(setExpandedExamples, def.itemKey)
                          }
                        >
                          <Text style={styles.examplesToggleText}>?</Text>
                        </TouchableOpacity>
                      )}

                      {isExpanded && examples.length > 0 && (
                        <Surface style={styles.examplesPanel} elevation={0}>
                          <Text variant="labelSmall" style={styles.examplesHeader}>
                            This might look like:
                          </Text>
                          {examples.map((ex, i) => (
                            <Text key={i} variant="bodySmall" style={styles.exampleItem}>
                              • {ex}
                            </Text>
                          ))}
                        </Surface>
                      )}
                    </View>
                  );
                })}
            </View>
          );
        })}

        {/* Custom Items */}
        {customItems.length > 0 && (
          <CollapsibleSection
            title="Custom Items"
            sectionKey="custom"
            collapsed={collapsedSections}
            onToggle={toggleSection}
            count={checkedCustom.size}
          >
            <View style={styles.pillRow}>
              {customItems.map((item) => {
                const checked = checkedCustom.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.pill,
                      checked
                        ? { backgroundColor: "#E0E7FF", borderColor: "#6366F1" }
                        : styles.pillInactive,
                    ]}
                    onPress={() => toggleSet(setCheckedCustom, item.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        checked
                          ? { color: "#4338CA" }
                          : styles.pillTextInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CollapsibleSection>
        )}

        {/* Impairments */}
        <CollapsibleSection
          title="Impairment"
          sectionKey="impairment"
          collapsed={collapsedSections}
          onToggle={toggleSection}
          count={
            Object.values(impairments).filter((v) => v !== "NONE").length
          }
        >
          {IMPAIRMENT_DOMAINS.map((domain) => {
            const current = impairments[domain.key] ?? "NONE";
            return (
              <View key={domain.key} style={styles.impairmentRow}>
                <Text variant="bodyMedium" style={styles.impairmentLabel}>{domain.label}</Text>
                <View style={styles.impairmentPills}>
                  {IMPAIRMENT_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.impairmentPill,
                        current === level
                          ? level === "SEVERE"
                            ? styles.impairmentSevere
                            : level === "PRESENT"
                            ? styles.impairmentPresent
                            : styles.impairmentNone
                          : styles.impairmentPillInactive,
                      ]}
                      onPress={() =>
                        setImpairments((prev) => ({
                          ...prev,
                          [domain.key]: level,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.impairmentPillText,
                          current === level
                            ? styles.impairmentPillTextActive
                            : styles.impairmentPillTextInactive,
                        ]}
                      >
                        {level === "NONE"
                          ? "None"
                          : level === "PRESENT"
                          ? "Present"
                          : "Severe"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </CollapsibleSection>

        {/* Missed Medications */}
        {medications.length > 0 && (
          <CollapsibleSection
            title="Missed Medications"
            sectionKey="meds"
            collapsed={collapsedSections}
            onToggle={toggleSection}
            count={missedMeds.size}
          >
            <View style={styles.pillRow}>
              {medications.map((med) => {
                const missed = missedMeds.has(med.id);
                return (
                  <TouchableOpacity
                    key={med.id}
                    style={[
                      styles.pill,
                      missed
                        ? { backgroundColor: palette.warningBg, borderColor: palette.warning }
                        : styles.pillInactive,
                    ]}
                    onPress={() => toggleSet(setMissedMeds, med.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        missed
                          ? { color: moodColors.MANIC.text }
                          : styles.pillTextInactive,
                      ]}
                    >
                      {med.name}
                      {med.dosage ? ` (${med.dosage})` : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CollapsibleSection>
        )}

        {/* Strategies */}
        {strategyList.length > 0 && (
          <CollapsibleSection
            title="Strategies Used"
            sectionKey="strategies"
            collapsed={collapsedSections}
            onToggle={toggleSection}
            count={checkedStrategies.size}
          >
            <View style={styles.pillRow}>
              {strategyList.map((s) => {
                const checked = checkedStrategies.has(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.pill,
                      checked
                        ? { backgroundColor: palette.secondaryFaint, borderColor: palette.secondary }
                        : styles.pillInactive,
                    ]}
                    onPress={() => toggleSet(setCheckedStrategies, s.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        checked
                          ? { color: "#065F46" }
                          : styles.pillTextInactive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CollapsibleSection>
        )}

        {/* Menstrual Tracking */}
        <CollapsibleSection
          title="Period Today?"
          sectionKey="menstrual"
          collapsed={collapsedSections}
          onToggle={toggleSection}
          count={menstrual ? 1 : 0}
        >
          <View style={styles.pillRow}>
            {MENSTRUAL_OPTIONS.map((opt) => {
              const selected = menstrual === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pill,
                    selected
                      ? { backgroundColor: "#FCE7F3", borderColor: "#DB2777" }
                      : styles.pillInactive,
                  ]}
                  onPress={() =>
                    setMenstrual(selected ? null : opt.value)
                  }
                >
                  <Text
                    style={[
                      styles.pillText,
                      selected
                        ? { color: "#9D174D" }
                        : styles.pillTextInactive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {menstrual && (
              <TouchableOpacity onPress={() => setMenstrual(null)}>
                <Text style={styles.clearLink}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </CollapsibleSection>

        {/* Notes */}
        <SectionHeader title="Notes" />
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="How was the day? Any observations..."
          placeholderTextColor={palette.textMuted}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Save button */}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          buttonColor={palette.primary}
          textColor="#ffffff"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonText}
        >
          {existingEntry ? "Update Entry" : "Save Entry"}
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──

function SectionHeader({ title }: { title: string }) {
  return <Text variant="titleSmall" style={styles.sectionTitle}>{title}</Text>;
}

function CollapsibleSection({
  title,
  sectionKey,
  collapsed,
  onToggle,
  count,
  children,
}: {
  title: string;
  sectionKey: string;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
  count: number;
  children: React.ReactNode;
}) {
  const isCollapsed = collapsed.has(sectionKey);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeaderRow}
        onPress={() => onToggle(sectionKey)}
      >
        <Text variant="titleSmall" style={styles.sectionTitle}>{title}</Text>
        <Text variant="bodySmall" style={styles.chevron}>{isCollapsed ? "▸" : "▾"}</Text>
        {count > 0 && (
          <Text variant="labelSmall" style={styles.countBadgeGeneric}>{count}</Text>
        )}
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: palette.textMuted, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 12,
  },

  // Date selector
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
  },
  dateArrow: { padding: 8 },
  dateArrowText: { fontSize: 28, color: palette.primary, fontWeight: "300" },
  dateArrowDisabled: { color: palette.textMuted },
  dateCenter: { alignItems: "center" },
  dateText: { fontSize: 16, fontWeight: "600", color: palette.textPrimary },
  existingBadge: {
    fontSize: 11,
    color: palette.warning,
    marginTop: 2,
    fontWeight: "500",
  },

  // Sections
  section: { marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.textSecondary,
    marginBottom: 8,
  },
  chevron: {
    fontSize: 14,
    color: palette.textMuted,
    marginLeft: 6,
    marginBottom: 8,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  countBadgeGeneric: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: 8,
    backgroundColor: palette.borderLight,
    color: palette.textSecondary,
    overflow: "hidden",
    marginBottom: 8,
  },

  // Pills (shared)
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  pillInactive: {
    backgroundColor: palette.card,
    borderColor: palette.border,
  },
  pillText: { fontSize: 14, fontWeight: "500" },
  pillTextInactive: { color: palette.textMuted },

  // Behavior items
  behaviorItem: { marginBottom: 6 },
  behaviorPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  behaviorPillText: { fontSize: 14, fontWeight: "500", flex: 1 },
  safetyBadge: { fontSize: 14, marginLeft: 6 },

  // Examples
  examplesToggle: {
    position: "absolute",
    right: 12,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: radius.md,
    backgroundColor: palette.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  examplesToggleText: { fontSize: 13, color: palette.textMuted, fontWeight: "600" },
  examplesPanel: {
    marginTop: 4,
    marginLeft: 8,
    padding: 10,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  examplesHeader: {
    fontSize: 12,
    fontStyle: "italic",
    color: palette.textSecondary,
    marginBottom: 4,
  },
  exampleItem: { fontSize: 12, color: palette.textSecondary, lineHeight: 18 },

  // Impairment
  impairmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  impairmentLabel: { fontSize: 14, color: palette.textSecondary, flex: 1 },
  impairmentPills: { flexDirection: "row", gap: 4 },
  impairmentPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: palette.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    elevation: 1,
  },
  impairmentPillInactive: {
    backgroundColor: palette.card,
    borderColor: palette.border,
  },
  impairmentNone: { backgroundColor: palette.borderLight, borderColor: palette.textMuted },
  impairmentPresent: { backgroundColor: palette.warningBg, borderColor: palette.warning },
  impairmentSevere: { backgroundColor: palette.errorBg, borderColor: palette.error },
  impairmentPillText: { fontSize: 12, fontWeight: "500" },
  impairmentPillTextActive: { color: palette.textPrimary },
  impairmentPillTextInactive: { color: palette.textMuted },

  // Menstrual
  clearLink: { color: palette.textMuted, fontSize: 13, marginLeft: 4, marginTop: 8 },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: palette.textPrimary,
    minHeight: 100,
    backgroundColor: palette.surfaceAlt,
    marginBottom: 20,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 12,
    backgroundColor: palette.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.warning,
  },
  errorBannerText: {
    color: palette.warning,
    fontWeight: "500",
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: palette.warning,
    borderRadius: radius.sm,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  // Save
  saveButton: {
    borderRadius: radius.md,
  },
  saveButtonContent: {
    paddingVertical: 6,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});
