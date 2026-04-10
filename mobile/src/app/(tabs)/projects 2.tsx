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
import {
  getTenants,
  getCurrentUserInfo,
  TenantSummary,
  CurrentUser,
} from "@/lib/api";

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#374151" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
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
    </SafeAreaView>
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View
        style={[
          styles.cardAccent,
          { backgroundColor: tenant.teenFavoriteColor ?? "#E5E7EB" },
        ]}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName}>{tenant.name}</Text>
          <View style={styles.cardBadges}>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
          </View>
        </View>

        {displayName !== tenant.name && (
          <Text style={styles.cardSubname}>{displayName}</Text>
        )}

        <View style={styles.cardMeta}>
          {tenant.teenFavoriteColor && (
            <View
              style={[
                styles.colorDot,
                { backgroundColor: tenant.teenFavoriteColor },
              ]}
            />
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
  },
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
  scrollContent: { padding: 16, gap: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  cardSubname: { fontSize: 14, color: "#6B7280", marginBottom: 6 },
  cardBadges: { flexDirection: "row", gap: 6, flexShrink: 0 },
  defaultBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: "600", color: "#065F46" },
  roleBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "500", color: "#6B7280" },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chevron: { fontSize: 20, color: "#9CA3AF", marginLeft: "auto" },
});
