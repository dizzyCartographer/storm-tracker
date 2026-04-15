import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Text, Card, Chip, ActivityIndicator, Button, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  getTenants,
  getCurrentUserInfo,
  TenantSummary,
  CurrentUser,
} from "@/lib/api";
import { palette, radius } from "@/lib/theme";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  CAREGIVER: "Caregiver",
  TEEN_SELF: "Self",
};

export default function ProjectsScreen() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [t, u] = await Promise.all([getTenants(), getCurrentUserInfo()]);
      setTenants(t);
      setCurrentUser(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>Projects</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={load} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : tenants.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.emptyText}>No projects yet.</Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
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
          {tenants.map((tenant) => (
            <ProjectCard
              key={tenant.id}
              tenant={tenant}
              isDefault={currentUser?.defaultTenantId === tenant.id}
              onPress={() => router.push(`/project/${tenant.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ProjectCard({
  tenant,
  isDefault,
  onPress,
}: {
  tenant: TenantSummary;
  isDefault: boolean;
  onPress: () => void;
}) {
  const role = ROLE_LABELS[tenant.role] ?? tenant.role;
  const displayName = tenant.teenNickname || tenant.name;

  return (
    <Surface style={styles.cardSurface} elevation={2}>
      <Card style={styles.card} onPress={onPress} mode="contained">
        <View style={styles.cardInner}>
          <View
            style={[
              styles.cardAccent,
              { backgroundColor: tenant.teenFavoriteColor ?? palette.border },
            ]}
          />

          <Card.Content style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Text variant="titleMedium" style={styles.cardName}>{tenant.name}</Text>
              <View style={styles.cardBadges}>
                {isDefault && (
                  <Chip
                    compact
                    textStyle={styles.chipText}
                    style={styles.defaultChip}
                  >
                    Default
                  </Chip>
                )}
                <Chip
                  compact
                  textStyle={styles.chipText}
                  style={styles.roleChip}
                >
                  {role}
                </Chip>
              </View>
            </View>

            {displayName !== tenant.name && (
              <Text variant="bodyMedium" style={styles.cardSubname}>{displayName}</Text>
            )}

            <View style={styles.cardMeta}>
              <Text variant="bodyLarge" style={styles.chevron}>›</Text>
            </View>
          </Card.Content>
        </View>
      </Card>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  headerTitle: { fontWeight: "700", color: palette.textPrimary },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: palette.error,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    borderColor: palette.border,
  },
  emptyText: { color: palette.textSecondary, marginBottom: 4 },
  emptySubtext: { color: palette.textMuted, textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  cardSurface: {
    borderRadius: radius.md,
    backgroundColor: palette.card,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  cardInner: {
    flexDirection: "row",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  cardName: {
    fontWeight: "700",
    color: palette.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardSubname: { color: palette.textSecondary, marginBottom: 6 },
  cardBadges: { flexDirection: "row", gap: 6, flexShrink: 0 },
  defaultChip: {
    backgroundColor: palette.successBg,
    borderRadius: radius.sm,
    height: 26,
  },
  roleChip: {
    backgroundColor: palette.borderLight,
    borderRadius: radius.sm,
    height: 26,
  },
  chipText: { fontSize: 11, marginHorizontal: 0, marginVertical: 0 },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  chevron: { color: palette.textMuted },
});
