import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getTenants,
  getFrameworkId,
  getBehaviorCategories,
  getBehaviorDefinitions,
  getCustomItems,
  getActiveMedications,
  getStrategies,
  getEntryByDate,
  saveEntry,
  TenantSummary,
  BehaviorCategoryRow,
  BehaviorDefinitionRow,
  CustomItemRow,
  MedicationRow,
  StrategyRow,
  EntryRow,
} from "@/lib/api";

// ── Constants ──

const MOODS = [
  { value: "MANIC", label: "Manic", bg: "#FEF3C7", text: "#92400E" },
  { value: "DEPRESSIVE", label: "Depressive", bg: "#DBEAFE", text: "#1E40AF" },
  { value: "NEUTRAL", label: "Neutral", bg: "#F3F4F6", text: "#374151" },
  { value: "MIXED", label: "Mixed", bg: "#EDE9FE", text: "#5B21B6" },
];

const DAY_QUALITIES = [
  { value: "GOOD", label: "Good", bg: "#D1FAE5", text: "#065F46" },
  { value: "NEUTRAL", label: "Neutral", bg: "#F3F4F6", text: "#374151" },
  { value: "BAD", label: "Bad", bg: "#FEE2E2", text: "#991B1B" },
  { value: "MIXED", label: "Mixed", bg: "#EDE9FE", text: "#5B21B6" },
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
  manic: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  depressive: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
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
  // Tenant state
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenant, setActiveTenant] = useState<TenantSummary | null>(null);

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

  // ── Load tenants ──
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

  // ── Load reference data when tenant changes ──
  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
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

  // ── Load existing entry when date or tenant changes ──
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

  // ── Group behaviors by category ──
  const behaviorsByCategory = useMemo(() => {
    const map = new Map<string, BehaviorDefinitionRow[]>();
    for (const b of behaviors) {
      const list = map.get(b.categoryId) ?? [];
      list.push(b);
      map.set(b.categoryId, list);
    }
    return map;
  }, [behaviors]);

  // ── Toggle helpers ──
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

  // ── Save ──
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
      // Reload the entry to get computed values
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

  // ── Render ──

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#374151" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Daily Log</Text>

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

        {/* Date selector */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => setDate(shiftDate(date, -1))}
          >
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
            {existingEntry && (
              <Text style={styles.existingBadge}>Editing existing entry</Text>
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
        </View>

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
                <View
                  style={[styles.poleDot, { backgroundColor: pole.dot }]}
                />
                <Text style={styles.sectionTitle}>{cat.name} Criteria</Text>
                <Text style={styles.chevron}>{isCollapsed ? "▸" : "▾"}</Text>
                {checkedBehaviors.size > 0 && (
                  <Text style={[styles.countBadge, { backgroundColor: pole.bg, color: pole.text }]}>
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
                        <View style={styles.examplesPanel}>
                          <Text style={styles.examplesHeader}>
                            This might look like:
                          </Text>
                          {examples.map((ex, i) => (
                            <Text key={i} style={styles.exampleItem}>
                              • {ex}
                            </Text>
                          ))}
                        </View>
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
                <Text style={styles.impairmentLabel}>{domain.label}</Text>
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
                        ? { backgroundColor: "#FEF3C7", borderColor: "#D97706" }
                        : styles.pillInactive,
                    ]}
                    onPress={() => toggleSet(setMissedMeds, med.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        missed
                          ? { color: "#92400E" }
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
                        ? { backgroundColor: "#D1FAE5", borderColor: "#059669" }
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
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {existingEntry ? "Update Entry" : "Save Entry"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
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
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{isCollapsed ? "▸" : "▾"}</Text>
        {count > 0 && (
          <Text style={styles.countBadgeGeneric}>{count}</Text>
        )}
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#6B7280", fontSize: 14 },
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

  // Date selector
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  dateArrow: { padding: 8 },
  dateArrowText: { fontSize: 28, color: "#374151", fontWeight: "300" },
  dateArrowDisabled: { color: "#D1D5DB" },
  dateCenter: { alignItems: "center" },
  dateText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  existingBadge: {
    fontSize: 11,
    color: "#D97706",
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
    color: "#374151",
    marginBottom: 8,
  },
  chevron: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 6,
    marginBottom: 8,
  },
  poleDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  countBadge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  countBadgeGeneric: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: "#E5E7EB",
    color: "#374151",
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
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  pillText: { fontSize: 14, fontWeight: "500" },
  pillTextInactive: { color: "#6B7280" },

  // Behavior items
  behaviorItem: { marginBottom: 6 },
  behaviorPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  behaviorPillText: { fontSize: 14, fontWeight: "500", flex: 1 },
  safetyBadge: { fontSize: 14, marginLeft: 6 },

  // Examples
  examplesToggle: {
    position: "absolute",
    right: 12,
    top: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  examplesToggleText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  examplesPanel: {
    marginTop: 4,
    marginLeft: 8,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  examplesHeader: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 4,
  },
  exampleItem: { fontSize: 12, color: "#4B5563", lineHeight: 18 },

  // Impairment
  impairmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  impairmentLabel: { fontSize: 14, color: "#374151", flex: 1 },
  impairmentPills: { flexDirection: "row", gap: 4 },
  impairmentPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  impairmentPillInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  impairmentNone: { backgroundColor: "#F3F4F6", borderColor: "#9CA3AF" },
  impairmentPresent: { backgroundColor: "#FEF3C7", borderColor: "#D97706" },
  impairmentSevere: { backgroundColor: "#FEE2E2", borderColor: "#DC2626" },
  impairmentPillText: { fontSize: 12, fontWeight: "500" },
  impairmentPillTextActive: { color: "#111827" },
  impairmentPillTextInactive: { color: "#9CA3AF" },

  // Menstrual
  clearLink: { color: "#6B7280", fontSize: 13, marginLeft: 4, marginTop: 8 },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
