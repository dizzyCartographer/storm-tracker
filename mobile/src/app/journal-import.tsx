import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, ActivityIndicator, Button, Surface, Chip } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  apiFetch,
  saveEntry,
  getFrameworkId,
  getBehaviorCategories,
  getBehaviorDefinitions,
  BehaviorCategoryRow,
  BehaviorDefinitionRow,
} from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { palette, moodColors, radius } from "@/lib/theme";

// ── Types ──

interface ParsedEntry {
  date: string | null;
  mood: "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED";
  dayQuality: "GOOD" | "NEUTRAL" | "BAD" | "MIXED";
  behaviorKeys: string[];
  impairments: Record<string, "NONE" | "PRESENT" | "SEVERE">;
  notes: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  followUpQuestions: string[];
}

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

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: palette.successBg, text: palette.success },
  MEDIUM: { bg: palette.warningBg, text: palette.warning },
  LOW: { bg: palette.errorBg, text: palette.error },
};

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

// ── Main Component ──

export default function JournalImportScreen() {
  const router = useRouter();
  const { selectedTenant, loading: projectLoading } = useProject();

  // Step: 1=input, 2=review, 3=saved
  const [step, setStep] = useState(1);

  // Step 1 state
  const [journalText, setJournalText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Step 2 state (parsed + editable)
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState<string>("NEUTRAL");
  const [dayQuality, setDayQuality] = useState<string>("NEUTRAL");
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const [impairments, setImpairments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  // Reference data for behavior display
  const [categories, setCategories] = useState<BehaviorCategoryRow[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorDefinitionRow[]>([]);

  // Step 3 / general
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load behavior reference data
  useEffect(() => {
    if (!selectedTenant) return;
    let cancelled = false;

    (async () => {
      try {
        const fwId = await getFrameworkId(selectedTenant.id);
        if (!fwId || cancelled) return;

        const cats = await getBehaviorCategories(fwId);
        if (cancelled) return;
        setCategories(cats);

        if (cats.length > 0) {
          const defs = await getBehaviorDefinitions(cats.map((c) => c.id));
          if (!cancelled) setBehaviors(defs);
        }
      } catch (e) {
        console.error("Failed to load behavior data:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTenant?.id]);

  const behaviorsByCategory = useMemo(() => {
    const map = new Map<string, BehaviorDefinitionRow[]>();
    for (const b of behaviors) {
      const list = map.get(b.categoryId) ?? [];
      list.push(b);
      map.set(b.categoryId, list);
    }
    return map;
  }, [behaviors]);

  // ── Step 1: Analyze ──

  const handleAnalyze = useCallback(async () => {
    if (!selectedTenant || !journalText.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await apiFetch("/api/parse-journal", {
        method: "POST",
        body: JSON.stringify({ text: journalText.trim(), tenantId: selectedTenant.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error (${res.status})`);
      }

      const result: ParsedEntry = await res.json();
      setParsed(result);

      // Populate editable fields from AI result
      setDate(result.date ?? todayStr());
      setMood(result.mood);
      setDayQuality(result.dayQuality);
      setCheckedBehaviors(new Set(result.behaviorKeys));
      setImpairments(result.impairments ?? {});
      setNotes(result.notes ?? "");

      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [selectedTenant, journalText]);

  // ── Step 2: Save ──

  const handleSave = useCallback(async () => {
    if (!selectedTenant) return;
    setSaving(true);
    setError(null);

    try {
      await saveEntry({
        tenantId: selectedTenant.id,
        mood,
        dayQuality,
        behaviorKeys: Array.from(checkedBehaviors),
        impairments,
        notes: notes.trim() || undefined,
        date,
      });

      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selectedTenant, mood, dayQuality, checkedBehaviors, impairments, notes, date]);

  // ── Toggle helpers ──

  function toggleBehavior(key: string) {
    setCheckedBehaviors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Render ──

  if (projectLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!selectedTenant) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyMedium" style={styles.mutedText}>
          Select a project first.
        </Text>
      </View>
    );
  }

  // ── Step 3: Saved ──
  if (step === 3) {
    return (
      <View style={styles.centered}>
        <Text variant="headlineSmall" style={styles.successTitle}>
          Entry Saved
        </Text>
        <Text variant="bodyMedium" style={styles.successSubtext}>
          Journal entry for {formatDateDisplay(date)} has been saved.
        </Text>
        <View style={styles.successButtons}>
          <Button
            mode="contained"
            onPress={() => {
              setStep(1);
              setJournalText("");
              setParsed(null);
              setError(null);
            }}
            buttonColor={palette.primary}
            textColor="#ffffff"
            style={styles.actionBtn}
          >
            Import Another
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            textColor={palette.primary}
            style={styles.actionBtn}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  // ── Step 1: Input ──
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineSmall" style={styles.pageTitle}>
            Import Journal
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Paste a freeform journal entry and AI will extract structured behavioral data.
          </Text>

          <TextInput
            style={styles.journalInput}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            placeholder="Paste your journal entry here..."
            placeholderTextColor={palette.textMuted}
            value={journalText}
            onChangeText={setJournalText}
          />

          {error && (
            <Surface style={styles.errorCard} elevation={0}>
              <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleAnalyze}
            disabled={analyzing || !journalText.trim()}
            loading={analyzing}
            buttonColor={palette.primary}
            textColor="#ffffff"
            style={styles.analyzeBtn}
            contentStyle={styles.analyzeBtnContent}
          >
            {analyzing ? "Analyzing..." : "Analyze Entry"}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Review & Edit ──
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.pageTitle}>
          Review & Edit
        </Text>

        {/* AI Confidence */}
        {parsed && (
          <Surface style={styles.confidenceCard} elevation={2}>
            <View style={styles.confidenceRow}>
              <Text variant="labelSmall" style={styles.confidenceLabel}>AI Confidence</Text>
              <Chip
                compact
                style={{
                  backgroundColor: CONFIDENCE_COLORS[parsed.confidence]?.bg ?? palette.borderLight,
                }}
                textStyle={{
                  color: CONFIDENCE_COLORS[parsed.confidence]?.text ?? palette.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {parsed.confidence}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.reasoningText}>
              {parsed.reasoning}
            </Text>
          </Surface>
        )}

        {/* Follow-up Questions */}
        {parsed && parsed.followUpQuestions.length > 0 && (
          <Surface style={styles.followUpCard} elevation={0}>
            <Text variant="labelSmall" style={styles.followUpTitle}>
              Follow-up Questions
            </Text>
            {parsed.followUpQuestions.map((q, i) => (
              <Text key={i} variant="bodySmall" style={styles.followUpItem}>
                {i + 1}. {q}
              </Text>
            ))}
          </Surface>
        )}

        {/* Date */}
        <SectionHeader title="Date" />
        <Surface style={styles.dateCard} elevation={1}>
          <Text variant="bodyMedium" style={styles.dateText}>
            {formatDateDisplay(date)}
          </Text>
        </Surface>

        {/* Mood */}
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

        {/* Day Quality */}
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
                  dayQuality === q.value ? { color: q.text } : styles.pillTextInactive,
                ]}
              >
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Behavior Criteria */}
        {categories.map((cat) => {
          const pole = POLE_COLORS[cat.slug] ?? POLE_COLORS.manic;
          const defs = behaviorsByCategory.get(cat.id) ?? [];

          return (
            <View key={cat.id} style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                {cat.name} Criteria
              </Text>
              <View style={styles.pillRow}>
                {defs.map((def) => {
                  const checked = checkedBehaviors.has(def.itemKey);
                  return (
                    <TouchableOpacity
                      key={def.id}
                      style={[
                        styles.behaviorPill,
                        checked
                          ? { backgroundColor: pole.bg, borderColor: pole.dot }
                          : styles.pillInactive,
                      ]}
                      onPress={() => toggleBehavior(def.itemKey)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          checked ? { color: pole.text } : styles.pillTextInactive,
                        ]}
                      >
                        {def.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Impairments */}
        <SectionHeader title="Impairment" />
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
                      setImpairments((prev) => ({ ...prev, [domain.key]: level }))
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
                      {level === "NONE" ? "None" : level === "PRESENT" ? "Present" : "Severe"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Notes */}
        <SectionHeader title="Notes" />
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Additional notes..."
          placeholderTextColor={palette.textMuted}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Original text */}
        {parsed && (
          <CollapsibleSection title="Original Text">
            <Surface style={styles.originalTextCard} elevation={0}>
              <Text variant="bodySmall" style={styles.originalText}>
                {journalText}
              </Text>
            </Surface>
          </CollapsibleSection>
        )}

        {error && (
          <Surface style={styles.errorCard} elevation={0}>
            <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
          </Surface>
        )}

        {/* Action buttons */}
        <View style={styles.reviewButtons}>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            buttonColor={palette.primary}
            textColor="#ffffff"
            style={styles.saveBtn}
            contentStyle={styles.saveBtnContent}
          >
            {saving ? "Saving..." : "Save Entry"}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setStep(1)}
            textColor={palette.textSecondary}
            style={styles.backBtn}
          >
            Back to Edit Text
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ──

function SectionHeader({ title }: { title: string }) {
  return <Text variant="titleSmall" style={styles.sectionTitle}>{title}</Text>;
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setCollapsed(!collapsed)}
      >
        <Text variant="titleSmall" style={styles.sectionTitle}>{title}</Text>
        <Text variant="bodySmall" style={styles.chevron}>
          {collapsed ? "▸" : "▾"}
        </Text>
      </TouchableOpacity>
      {!collapsed && children}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
    padding: 24,
  },
  mutedText: { color: palette.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: palette.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Step 1: Input
  journalInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: palette.textPrimary,
    minHeight: 200,
    backgroundColor: palette.surfaceAlt,
    marginBottom: 16,
    lineHeight: 22,
  },
  analyzeBtn: { borderRadius: radius.md, marginBottom: 12 },
  analyzeBtnContent: { paddingVertical: 6 },

  // Step 2: Review
  confidenceCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  confidenceLabel: {
    fontWeight: "700",
    color: palette.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasoningText: {
    color: palette.textSecondary,
    lineHeight: 20,
  },

  followUpCard: {
    backgroundColor: palette.warningBg,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  followUpTitle: {
    fontWeight: "700",
    color: palette.warning,
    marginBottom: 6,
  },
  followUpItem: {
    color: "#92400E",
    lineHeight: 20,
    marginBottom: 4,
  },

  dateCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    color: palette.textPrimary,
    fontWeight: "500",
  },

  // Shared pill styles
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.textSecondary,
    marginBottom: 8,
  },
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

  behaviorPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

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
    marginBottom: 16,
  },

  // Collapsible
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  chevron: {
    fontSize: 14,
    color: palette.textMuted,
    marginLeft: 6,
    marginBottom: 8,
  },

  originalTextCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  originalText: {
    color: palette.textSecondary,
    lineHeight: 20,
  },

  // Error
  errorCard: {
    backgroundColor: palette.errorBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: palette.error },

  // Review buttons
  reviewButtons: {
    gap: 10,
    marginTop: 8,
  },
  saveBtn: { borderRadius: radius.md },
  saveBtnContent: { paddingVertical: 6 },
  backBtn: { borderRadius: radius.md },

  // Step 3: Success
  successTitle: {
    fontWeight: "700",
    color: palette.primary,
    marginBottom: 8,
  },
  successSubtext: {
    color: palette.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  successButtons: { gap: 12, width: "100%" },
  actionBtn: { borderRadius: radius.md },
});
