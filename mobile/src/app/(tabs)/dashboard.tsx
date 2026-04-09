import React, { useCallback, useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import {
  getTenants,
  getCurrentUserInfo,
  getRecentEntries,
  getEpisodes,
  getSignals,
  getPredictions,
  getSuggestions,
  TenantSummary,
  EntryRow,
  EpisodeRow,
  SignalRow,
  PredictionRow,
  SuggestionRow,
} from "@/lib/api";

// ── Mood colors ──

const MOOD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  MANIC: { bg: "#FEF3C7", text: "#92400E", label: "Manic" },
  DEPRESSIVE: { bg: "#DBEAFE", text: "#1E40AF", label: "Depressive" },
  MIXED: { bg: "#EDE9FE", text: "#5B21B6", label: "Mixed" },
  NEUTRAL: { bg: "#F3F4F6", text: "#374151", label: "Neutral" },
};

const DAY_QUALITY: Record<string, string> = {
  GOOD: "Good day",
  NEUTRAL: "Neutral day",
  BAD: "Bad day",
  MIXED: "Mixed day",
};

// ── Helpers ──

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function displayMood(entry: EntryRow): string {
  return entry.computedMood ?? entry.mood;
}

function hasBehaviorDetail(entry: EntryRow): boolean {
  return Array.isArray(entry.behaviorKeys) && entry.behaviorKeys.length > 0;
}

function impairmentCount(entry: EntryRow): number {
  if (!entry.impairments || typeof entry.impairments !== "object") return 0;
  return Object.values(entry.impairments).filter((v) => v !== "NONE").length;
}

// ── Components ──

function ProjectSelector({
  tenants,
  selected,
  onSelect,
}: {
  tenants: TenantSummary[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (tenants.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.projectRow}
      contentContainerStyle={styles.projectRowContent}
    >
      {tenants.map((t) => {
        const isActive = t.id === selected;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={[
              styles.projectPill,
              isActive && styles.projectPillActive,
              t.teenFavoriteColor && isActive
                ? { borderColor: t.teenFavoriteColor }
                : undefined,
            ]}
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
                styles.projectPillText,
                isActive && styles.projectPillTextActive,
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

function EntryCard({ entry }: { entry: EntryRow }) {
  const router = useRouter();
  const mood = displayMood(entry);
  const moodStyle = MOOD_COLORS[mood] ?? MOOD_COLORS.NEUTRAL;
  const hasBehaviors = hasBehaviorDetail(entry);
  const missedMeds = Array.isArray(entry.missedMedIds)
    ? entry.missedMedIds.length
    : 0;
  const impairments = impairmentCount(entry);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/entry/${entry.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
        <View style={[styles.moodBadge, { backgroundColor: moodStyle.bg }]}>
          <Text style={[styles.moodBadgeText, { color: moodStyle.text }]}>
            {moodStyle.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardQuality}>
        {DAY_QUALITY[entry.dayQuality] ?? entry.dayQuality}
      </Text>

      <View style={styles.cardMeta}>
        {hasBehaviors ? (
          <Text style={styles.metaText}>
            {entry.behaviorKeys.length} behaviors
          </Text>
        ) : (
          <Text style={styles.metaQuickLog}>quick log only</Text>
        )}

        {impairments > 0 && (
          <Text style={styles.metaText}>{impairments} impairments</Text>
        )}

        {missedMeds > 0 && (
          <Text style={styles.metaMissed}>{missedMeds} missed meds</Text>
        )}
      </View>

      {hasBehaviors && mood !== entry.mood && (
        <Text style={styles.reportedMood}>reported {entry.mood.toLowerCase()}</Text>
      )}

      {entry.notes && (
        <Text style={styles.cardNotes} numberOfLines={2}>
          {entry.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function SignalCard({ signal }: { signal: SignalRow }) {
  const levelColors: Record<string, { bg: string; text: string }> = {
    ALERT: { bg: "#FEE2E2", text: "#991B1B" },
    WARNING: { bg: "#FEF3C7", text: "#92400E" },
    INFO: { bg: "#DBEAFE", text: "#1E40AF" },
  };
  const c = levelColors[signal.level] ?? levelColors.INFO;

  return (
    <View style={[styles.analysisCard, { borderLeftColor: c.text }]}>
      <View style={[styles.levelBadge, { backgroundColor: c.bg }]}>
        <Text style={[styles.levelBadgeText, { color: c.text }]}>
          {signal.level}
        </Text>
      </View>
      <Text style={styles.analysisTitle}>{signal.title}</Text>
      <Text style={styles.analysisDesc}>{signal.description}</Text>
    </View>
  );
}

function EpisodeCard({ episode }: { episode: EpisodeRow }) {
  const mood = MOOD_COLORS[episode.type] ?? MOOD_COLORS.NEUTRAL;
  return (
    <View style={[styles.analysisCard, { borderLeftColor: mood.text }]}>
      <View style={styles.analysisCardHeader}>
        <View style={[styles.moodBadge, { backgroundColor: mood.bg }]}>
          <Text style={[styles.moodBadgeText, { color: mood.text }]}>
            {mood.label}
          </Text>
        </View>
        <Text style={styles.analysisMeta}>
          {episode.dayCount}d &middot;{" "}
          {episode.confidence === "DSM5_MET"
            ? "Pattern consistent with DSM-5"
            : "Emerging pattern"}
        </Text>
      </View>
      <Text style={styles.analysisDesc}>
        {formatDate(episode.startDate)} — {formatDate(episode.endDate)}
      </Text>
      {episode.criteriaNote && (
        <Text style={styles.analysisDesc}>{episode.criteriaNote}</Text>
      )}
    </View>
  );
}

// ── Main Screen ──

export default function DashboardScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn]);

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load data when tenant changes
  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant);
    }
  }, [selectedTenant]);

  async function loadTenants() {
    try {
      setLoading(true);
      setError(null);
      const [t, user] = await Promise.all([getTenants(), getCurrentUserInfo()]);
      setTenants(t);
      if (t.length > 0) {
        const defaultId = user?.defaultTenantId;
        const hasDefault = defaultId && t.some((tenant) => tenant.id === defaultId);
        setSelectedTenant(hasDefault ? defaultId : t[0].id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setLoading(false);
    }
  }

  async function loadTenantData(tenantId: string) {
    try {
      setLoading(true);
      setError(null);

      const [e, ep, sig, pred, sug] = await Promise.all([
        getRecentEntries(tenantId),
        getEpisodes(tenantId),
        getSignals(tenantId),
        getPredictions(tenantId),
        getSuggestions(tenantId),
      ]);

      setEntries(e);
      setEpisodes(ep);
      setSignals(sig);
      setPredictions(pred);
      setSuggestions(sug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    if (!selectedTenant) return;
    setRefreshing(true);
    await loadTenantData(selectedTenant);
    setRefreshing(false);
  }, [selectedTenant]);

  const activeTenant = tenants.find((t) => t.id === selectedTenant);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Storm Tracker</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOutLink}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Project Selector */}
      <ProjectSelector
        tenants={tenants}
        selected={selectedTenant}
        onSelect={setSelectedTenant}
      />

      {/* Accent bar */}
      {activeTenant?.teenFavoriteColor && (
        <View
          style={[
            styles.accentBar,
            { backgroundColor: activeTenant.teenFavoriteColor },
          ]}
        />
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#374151" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              selectedTenant
                ? loadTenantData(selectedTenant)
                : loadTenants()
            }
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tenants.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No projects yet.</Text>
          <Text style={styles.emptySubtext}>
            Create a project on the web app to get started.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Signals (alerts first) */}
          {signals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Signals</Text>
              {signals.map((s) => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </View>
          )}

          {/* Episodes */}
          {episodes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Possible Episodes</Text>
              {episodes.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </View>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              {suggestions.map((s) => (
                <View key={s.id} style={styles.suggestionCard}>
                  <Text style={styles.suggestionCategory}>
                    {s.category.replace(/_/g, " ")}
                  </Text>
                  <Text style={styles.analysisTitle}>{s.title}</Text>
                  <Text style={styles.analysisDesc}>{s.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patterns</Text>
              {predictions.map((p) => (
                <View key={p.id} style={styles.suggestionCard}>
                  <Text style={styles.analysisTitle}>{p.title}</Text>
                  <Text style={styles.analysisDesc}>{p.description}</Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {p.confidence.toLowerCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recent Entries */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {entries.length === 0 ? (
              <Text style={styles.emptySubtext}>No entries yet.</Text>
            ) : (
              entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  signOutLink: { fontSize: 14, color: "#6B7280" },

  projectRow: { maxHeight: 48 },
  projectRowContent: { paddingHorizontal: 16, gap: 8 },
  projectPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  projectPillActive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#374151",
  },
  projectPillText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  projectPillTextActive: { color: "#111827", fontWeight: "600" },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  accentBar: { height: 3, marginTop: 8 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 14, color: "#DC2626", textAlign: "center", marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  retryText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  emptyText: { fontSize: 16, color: "#6B7280", marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },

  // Entry cards
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardDate: { fontSize: 14, fontWeight: "600", color: "#374151" },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  moodBadgeText: { fontSize: 12, fontWeight: "600" },
  cardQuality: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  metaText: { fontSize: 12, color: "#6B7280" },
  metaQuickLog: { fontSize: 12, color: "#D97706", fontStyle: "italic" },
  metaMissed: { fontSize: 12, color: "#DC2626" },
  reportedMood: { fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 4 },
  cardNotes: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  // Analysis cards
  analysisCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9CA3AF",
  },
  analysisCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  analysisTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 2 },
  analysisDesc: { fontSize: 13, color: "#6B7280" },
  analysisMeta: { fontSize: 12, color: "#9CA3AF" },

  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  levelBadgeText: { fontSize: 11, fontWeight: "700" },

  suggestionCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  suggestionCategory: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confidenceText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
});
