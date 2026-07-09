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
import { useRouter } from "expo-router";
import {
  getRecentEntries,
  getEpisodes,
  getSignals,
  getPredictions,
  getSuggestions,
  EntryRow,
  EpisodeRow,
  SignalRow,
  PredictionRow,
  SuggestionRow,
} from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { palette, moodColors, radius } from "@/lib/theme";

// ── Constants ──

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

function EntryCard({ entry }: { entry: EntryRow }) {
  const router = useRouter();
  const mood = displayMood(entry);
  const moodStyle = moodColors[mood] ?? moodColors.NEUTRAL;
  const hasBehaviors = hasBehaviorDetail(entry);
  const missedMeds = Array.isArray(entry.missedMedIds)
    ? entry.missedMedIds.length
    : 0;
  const impairments = impairmentCount(entry);

  return (
    <Surface style={styles.card} elevation={2}>
      <Card
        style={styles.cardInner}
        onPress={() => router.push(`/entry/${entry.id}`)}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleSmall" style={styles.cardDate}>
              {formatDate(entry.date)}
            </Text>
            <Chip
              compact
              textStyle={{ fontSize: 11, color: moodStyle.text }}
              style={[styles.moodChip, { backgroundColor: moodStyle.bg }]}
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
    </Surface>
  );
}

function SignalCard({ signal }: { signal: SignalRow }) {
  const levelColors: Record<string, { bg: string; text: string }> = {
    ALERT: { bg: palette.errorBg, text: palette.error },
    WARNING: { bg: palette.warningBg, text: palette.warning },
    INFO: { bg: "#DBEAFE", text: "#1E40AF" },
  };
  const c = levelColors[signal.level] ?? levelColors.INFO;

  return (
    <Surface
      style={[styles.analysisCard, { borderLeftColor: c.text }]}
      elevation={3}
    >
      <Chip
        compact
        textStyle={{ fontSize: 10, color: c.text, fontWeight: "700" }}
        style={[styles.levelChip, { backgroundColor: c.bg }]}
      >
        {signal.level}
      </Chip>
      <Text variant="titleSmall" style={styles.analysisTitle}>
        {signal.title}
      </Text>
      <Text variant="bodySmall" style={styles.analysisDesc}>
        {signal.description}
      </Text>
    </Surface>
  );
}

function EpisodeCard({ episode }: { episode: EpisodeRow }) {
  const mood = moodColors[episode.type] ?? moodColors.NEUTRAL;
  return (
    <Surface
      style={[styles.analysisCard, { borderLeftColor: mood.text }]}
      elevation={3}
    >
      <View style={styles.analysisCardHeader}>
        <Chip
          compact
          textStyle={{ fontSize: 11, color: mood.text }}
          style={[styles.moodChip, { backgroundColor: mood.bg }]}
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
  const { selectedTenant, tenants, loading: projectLoading, error: projectError } = useProject();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant.id);
    } else if (!projectLoading) {
      setLoading(false);
    }
  }, [selectedTenant?.id, projectLoading]);

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
    await loadTenantData(selectedTenant.id);
    setRefreshing(false);
  }, [selectedTenant?.id]);

  return (
    <View style={styles.container}>
      {(loading || projectLoading) && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
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
                ? loadTenantData(selectedTenant.id)
                : undefined
            }
          >
            Retry
          </Button>
        </View>
      ) : tenants.length === 0 ? (
        // ST-077: when the project load FAILED, the shared banner in the tabs
        // layout owns the message — never claim "No projects yet" on an error.
        <View style={styles.centered}>
          {!projectError && (
            <>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No projects yet.
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                Create a project on the web app to get started.
              </Text>
            </>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Signals */}
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
                  <Surface key={s.id} style={styles.suggestionCard} elevation={2}>
                    <Text
                      variant="labelSmall"
                      style={styles.suggestionCategory}
                    >
                      {s.category.replace(/_/g, " ")}
                    </Text>
                    <Text variant="titleSmall" style={styles.analysisTitle}>
                      {s.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.analysisDesc}>
                      {s.description}
                    </Text>
                  </Surface>
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
                  <Surface key={p.id} style={styles.suggestionCard} elevation={2}>
                    <Text variant="titleSmall" style={styles.analysisTitle}>
                      {p.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.analysisDesc}>
                      {p.description}
                    </Text>
                    <Text variant="labelSmall" style={styles.confidenceText}>
                      Confidence: {p.confidence.toLowerCase()}
                    </Text>
                  </Surface>
                ))}
              </View>
            </List.Accordion>
          )}

          <Divider style={styles.sectionDivider} />

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
    padding: 24,
  },
  errorText: { color: palette.error, textAlign: "center", marginBottom: 12 },
  emptyText: { color: palette.textSecondary, marginBottom: 4 },
  emptySubtext: { color: palette.textMuted, textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionTitle: {
    fontWeight: "700",
    color: palette.textSecondary,
  },
  sectionDivider: { marginVertical: 8, backgroundColor: palette.borderLight },

  accordion: {
    backgroundColor: palette.background,
    paddingHorizontal: 0,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Entry cards
  card: {
    marginBottom: 10,
    borderRadius: radius.md,
    backgroundColor: palette.card,
  },
  cardInner: {
    backgroundColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardDate: { color: palette.textPrimary },
  moodChip: { borderRadius: radius.sm },
  cardQuality: { color: palette.textSecondary, marginBottom: 6 },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  metaText: { color: palette.textSecondary },
  metaQuickLog: { color: palette.warning, fontStyle: "italic" },
  metaMissed: { color: palette.error },
  reportedMood: { color: palette.textMuted, fontStyle: "italic", marginBottom: 4 },
  cardNotes: { color: palette.textSecondary, marginTop: 4 },

  // Analysis cards
  analysisCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: palette.textMuted,
  },
  analysisCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  analysisTitle: { color: palette.textPrimary },
  analysisDesc: { color: palette.textSecondary },
  analysisMeta: { color: palette.textMuted },
  levelChip: { alignSelf: "flex-start", marginBottom: 4, borderRadius: radius.sm },

  suggestionCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  suggestionCategory: {
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confidenceText: { color: palette.textMuted, marginTop: 4 },
});
