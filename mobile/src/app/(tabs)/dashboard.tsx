import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
  List,
  Surface,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
import { HeaderMenu } from "@/components/header-menu";

// ── Mood colors ──

const MOOD_COLORS: Record<string, { bg: string; text: string; label: string }> =
  {
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
          <Chip
            key={t.id}
            selected={isActive}
            onPress={() => onSelect(t.id)}
            mode={isActive ? "flat" : "outlined"}
            style={[
              isActive && t.teenFavoriteColor
                ? { borderColor: t.teenFavoriteColor, borderWidth: 1.5 }
                : undefined,
            ]}
            textStyle={{ fontWeight: isActive ? "600" : "400" }}
          >
            {t.teenNickname || t.name}
          </Chip>
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
    <Card
      style={styles.card}
      onPress={() => router.push(`/entry/${entry.id}`)}
      mode="contained"
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleSmall">{formatDate(entry.date)}</Text>
          <Chip
            compact
            textStyle={{ fontSize: 11, color: moodStyle.text }}
            style={{ backgroundColor: moodStyle.bg }}
          >
            {moodStyle.label}
          </Chip>
        </View>

        <Text variant="bodySmall" style={styles.cardQuality}>
          {DAY_QUALITY[entry.dayQuality] ?? entry.dayQuality}
        </Text>

        <View style={styles.cardMeta}>
          {hasBehaviors ? (
            <Text variant="labelSmall" style={styles.metaText}>
              {entry.behaviorKeys.length} behaviors
            </Text>
          ) : (
            <Text variant="labelSmall" style={styles.metaQuickLog}>
              quick log only
            </Text>
          )}

          {impairments > 0 && (
            <Text variant="labelSmall" style={styles.metaText}>
              {impairments} impairments
            </Text>
          )}

          {missedMeds > 0 && (
            <Text variant="labelSmall" style={styles.metaMissed}>
              {missedMeds} missed meds
            </Text>
          )}
        </View>

        {hasBehaviors && mood !== entry.mood && (
          <Text variant="labelSmall" style={styles.reportedMood}>
            reported {entry.mood.toLowerCase()}
          </Text>
        )}

        {entry.notes && (
          <Text variant="bodySmall" style={styles.cardNotes} numberOfLines={2}>
            {entry.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
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
    <Surface style={[styles.analysisCard, { borderLeftColor: c.text }]} elevation={0}>
      <Chip
        compact
        textStyle={{ fontSize: 10, color: c.text, fontWeight: "700" }}
        style={{ backgroundColor: c.bg, alignSelf: "flex-start", marginBottom: 4 }}
      >
        {signal.level}
      </Chip>
      <Text variant="titleSmall">{signal.title}</Text>
      <Text variant="bodySmall" style={styles.analysisDesc}>
        {signal.description}
      </Text>
    </Surface>
  );
}

function EpisodeCard({ episode }: { episode: EpisodeRow }) {
  const mood = MOOD_COLORS[episode.type] ?? MOOD_COLORS.NEUTRAL;
  return (
    <Surface style={[styles.analysisCard, { borderLeftColor: mood.text }]} elevation={0}>
      <View style={styles.analysisCardHeader}>
        <Chip
          compact
          textStyle={{ fontSize: 11, color: mood.text }}
          style={{ backgroundColor: mood.bg }}
        >
          {mood.label}
        </Chip>
        <Text variant="labelSmall" style={styles.analysisMeta}>
          {episode.dayCount}d ·{" "}
          {episode.confidence === "DSM5_MET"
            ? "Pattern consistent with DSM-5"
            : "Emerging pattern"}
        </Text>
      </View>
      <Text variant="bodySmall" style={styles.analysisDesc}>
        {formatDate(episode.startDate)} — {formatDate(episode.endDate)}
      </Text>
      {episode.criteriaNote && (
        <Text variant="bodySmall" style={styles.analysisDesc}>
          {episode.criteriaNote}
        </Text>
      )}
    </Surface>
  );
}

// ── Main Screen ──

export default function DashboardScreen() {
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
        const hasDefault =
          defaultId && t.some((tenant) => tenant.id === defaultId);
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
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Storm Tracker
        </Text>
        <HeaderMenu />
      </View>

      {/* Project Selector */}
      <ProjectSelector
        tenants={tenants}
        selected={selectedTenant}
        onSelect={setSelectedTenant}
      />

      {/* Accent bar */}
      {activeTenant?.teenFavoriteColor && (
        <Divider
          style={[
            styles.accentBar,
            { backgroundColor: activeTenant.teenFavoriteColor },
          ]}
        />
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
          <Button
            mode="outlined"
            onPress={() =>
              selectedTenant
                ? loadTenantData(selectedTenant)
                : loadTenants()
            }
          >
            Retry
          </Button>
        </View>
      ) : tenants.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No projects yet.
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtext}>
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
            <List.Accordion
              title={`Signals (${signals.length})`}
              titleStyle={styles.sectionTitle}
              style={styles.accordion}
            >
              <View style={styles.accordionContent}>
                {signals.map((s) => (
                  <SignalCard key={s.id} signal={s} />
                ))}
              </View>
            </List.Accordion>
          )}

          {/* Episodes */}
          {episodes.length > 0 && (
            <List.Accordion
              title={`Possible Episodes (${episodes.length})`}
              titleStyle={styles.sectionTitle}
              style={styles.accordion}
            >
              <View style={styles.accordionContent}>
                {episodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </View>
            </List.Accordion>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <List.Accordion
              title={`Suggestions (${suggestions.length})`}
              titleStyle={styles.sectionTitle}
              style={styles.accordion}
            >
              <View style={styles.accordionContent}>
                {suggestions.map((s) => (
                  <Card key={s.id} style={styles.suggestionCard} mode="contained">
                    <Card.Content>
                      <Text
                        variant="labelSmall"
                        style={styles.suggestionCategory}
                      >
                        {s.category.replace(/_/g, " ")}
                      </Text>
                      <Text variant="titleSmall">{s.title}</Text>
                      <Text variant="bodySmall" style={styles.analysisDesc}>
                        {s.description}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </List.Accordion>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <List.Accordion
              title={`Patterns (${predictions.length})`}
              titleStyle={styles.sectionTitle}
              style={styles.accordion}
            >
              <View style={styles.accordionContent}>
                {predictions.map((p) => (
                  <Card key={p.id} style={styles.suggestionCard} mode="contained">
                    <Card.Content>
                      <Text variant="titleSmall">{p.title}</Text>
                      <Text variant="bodySmall" style={styles.analysisDesc}>
                        {p.description}
                      </Text>
                      <Text variant="labelSmall" style={styles.confidenceText}>
                        Confidence: {p.confidence.toLowerCase()}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </List.Accordion>
          )}

          <Divider style={{ marginVertical: 8 }} />

          {/* Recent Entries */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Entries
            </Text>
            {entries.length === 0 ? (
              <Text variant="bodySmall" style={styles.emptySubtext}>
                No entries yet.
              </Text>
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
  headerTitle: { fontWeight: "700", color: "#111827" },

  projectRow: { maxHeight: 48 },
  projectRowContent: { paddingHorizontal: 16, gap: 8 },

  accentBar: { height: 3, marginTop: 8 },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: { color: "#DC2626", textAlign: "center", marginBottom: 12 },
  emptyText: { color: "#6B7280", marginBottom: 4 },
  emptySubtext: { color: "#9CA3AF", textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionTitle: {
    fontWeight: "700",
    color: "#374151",
  },

  accordion: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 0,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Entry cards
  card: {
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardQuality: { color: "#6B7280", marginBottom: 6 },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  metaText: { color: "#6B7280" },
  metaQuickLog: { color: "#D97706", fontStyle: "italic" },
  metaMissed: { color: "#DC2626" },
  reportedMood: { color: "#9CA3AF", fontStyle: "italic", marginBottom: 4 },
  cardNotes: { color: "#6B7280", marginTop: 4 },

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
  analysisDesc: { color: "#6B7280" },
  analysisMeta: { color: "#9CA3AF" },

  suggestionCard: {
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
  },
  suggestionCategory: {
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confidenceText: { color: "#9CA3AF", marginTop: 4 },
});
