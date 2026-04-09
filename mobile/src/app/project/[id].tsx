import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
  Surface,
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  getTenantById,
  getTenantMembers,
  getUsersByIds,
  getTenantFrameworkDetails,
  getFullMedications,
  getFullStrategies,
  getCurrentUserInfo,
  setDefaultTenant,
  TenantDetail,
  MemberRow,
  UserInfoRow,
  FrameworkSummary,
  FullMedicationRow,
  FullStrategyRow,
  CurrentUser,
} from "@/lib/api";
import { palette, radius } from "@/lib/theme";

// ── Helpers ──

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  CAREGIVER: "Caregiver",
  TEEN_SELF: "Self",
};

const PURPOSE_LABELS: Record<string, string> = {
  ONGOING_TRACKING: "Ongoing Tracking",
  DIAGNOSTIC_COLLECTION: "Diagnostic Data Collection",
};

// ── Main Screen ──

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [userMap, setUserMap] = useState<Map<string, UserInfoRow>>(new Map());
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [medications, setMedications] = useState<FullMedicationRow[]>([]);
  const [strategies, setStrategies] = useState<FullStrategyRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (tenant?.name) {
      navigation.setOptions({ headerTitle: tenant.name });
    }
  }, [tenant?.name]);

  async function load() {
    try {
      setError(null);
      const [t, mems, fws, meds, strats, user] = await Promise.all([
        getTenantById(id!),
        getTenantMembers(id!),
        getTenantFrameworkDetails(id!),
        getFullMedications(id!),
        getFullStrategies(id!),
        getCurrentUserInfo(),
      ]);

      setTenant(t);
      setMembers(mems);
      setFrameworks(fws);
      setMedications(meds);
      setStrategies(strats);
      setCurrentUser(user);

      if (mems.length > 0) {
        const ids = mems.map((m) => m.userId);
        const users = await getUsersByIds(ids);
        const map = new Map<string, UserInfoRow>();
        users.forEach((u) => map.set(u.id, u));
        setUserMap(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [id]);

  async function handleSetDefault() {
    if (!currentUser || !id) return;
    try {
      setSettingDefault(true);
      await setDefaultTenant(currentUser.id, id);
      setCurrentUser({ ...currentUser, defaultTenantId: id });
    } catch (e) {
      console.error("setDefaultTenant error:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to set default project.");
    } finally {
      setSettingDefault(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (error || !tenant) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error ?? "Project not found"}
        </Text>
        <Button mode="outlined" onPress={load} style={{ marginTop: 12 }}>
          Retry
        </Button>
      </View>
    );
  }

  const isDefault = currentUser?.defaultTenantId === id;
  const userMembership = members.find((m) => m.userId === currentUser?.id);
  const isOwner = userMembership?.role === "OWNER";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {tenant.teenFavoriteColor && (
        <View
          style={[styles.accentBar, { backgroundColor: tenant.teenFavoriteColor }]}
        />
      )}

      {isDefault && (
        <View style={styles.defaultRow}>
          <Chip
            mode="flat"
            compact
            style={styles.defaultBadge}
            textStyle={styles.defaultBadgeText}
          >
            Default Project
          </Chip>
        </View>
      )}

      {(tenant.description || tenant.purpose) && (
        <Section title="About">
          {tenant.purpose && (
            <InfoRow
              label="Purpose"
              value={PURPOSE_LABELS[tenant.purpose] ?? tenant.purpose}
            />
          )}
          {tenant.description && (
            <Surface style={styles.notesCard} elevation={2}>
              <Text variant="bodyMedium" style={styles.notesText}>
                {tenant.description}
              </Text>
            </Surface>
          )}
        </Section>
      )}

      <Section title="Teen Info">
        <InfoRow label="Name" value={tenant.teenFullName} />
        <InfoRow label="Nickname" value={tenant.teenNickname} />
        <InfoRow label="Birthday" value={formatDate(tenant.teenBirthday)} />
        {tenant.teenFavoriteColor && (
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Favorite Color
            </Text>
            <View style={styles.colorRow}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: tenant.teenFavoriteColor },
                ]}
              />
              <Text variant="bodyMedium" style={styles.infoValue}>
                {tenant.teenFavoriteColor}
              </Text>
            </View>
          </View>
        )}
        <InfoRow label="School" value={tenant.teenSchool} />
        <InfoRow label="Favorite Subject" value={tenant.teenFavoriteSubject} />
        {tenant.teenHasIep != null && (
          <InfoRow label="Has IEP" value={tenant.teenHasIep ? "Yes" : "No"} />
        )}
        <InfoRow label="Diagnosis" value={tenant.teenDiagnosis} />
        <InfoRow label="Other Health" value={tenant.teenOtherHealth} />
        {tenant.teenInterests && (
          <View style={styles.infoBlock}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Interests
            </Text>
            <Text variant="bodyMedium" style={styles.infoBlockText}>
              {tenant.teenInterests}
            </Text>
          </View>
        )}
      </Section>

      {(tenant.onsetDate || tenant.familyHistory) && (
        <Section title="Background">
          <InfoRow label="Onset / First Suspected" value={formatDate(tenant.onsetDate)} />
          {tenant.familyHistory && (
            <View style={styles.infoBlock}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                Family History
              </Text>
              <Text variant="bodyMedium" style={styles.infoBlockText}>
                {tenant.familyHistory}
              </Text>
            </View>
          )}
        </Section>
      )}

      <Section title={`Medications (${medications.length})`}>
        {medications.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyItem}>
            No medications logged.
          </Text>
        ) : (
          medications.map((med) => (
            <Surface key={med.id} style={styles.listCard} elevation={2}>
              <Text variant="titleSmall" style={styles.listCardTitle}>
                {med.name}
              </Text>
              {med.dosage && (
                <Text variant="bodySmall" style={styles.listCardSub}>
                  {med.dosage}
                </Text>
              )}
              {med.frequency && (
                <Text variant="bodySmall" style={styles.listCardMeta}>
                  {med.frequency}
                </Text>
              )}
              {med.instructions && (
                <Text variant="bodySmall" style={styles.listCardMeta}>
                  {med.instructions}
                </Text>
              )}
            </Surface>
          ))
        )}
      </Section>

      <Section title={`Strategies (${strategies.length})`}>
        {strategies.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyItem}>
            No strategies logged.
          </Text>
        ) : (
          strategies.map((s) => (
            <Surface key={s.id} style={styles.listCard} elevation={2}>
              <View style={styles.listCardHeader}>
                <Text variant="titleSmall" style={styles.listCardTitle}>
                  {s.name}
                </Text>
                {s.category && (
                  <Chip
                    mode="flat"
                    compact
                    style={styles.categoryBadge}
                    textStyle={styles.categoryBadgeText}
                  >
                    {s.category.replace(/_/g, " ")}
                  </Chip>
                )}
              </View>
              {s.description && (
                <Text variant="bodySmall" style={styles.listCardMeta}>
                  {s.description}
                </Text>
              )}
            </Surface>
          ))
        )}
      </Section>

      {frameworks.length > 0 && (
        <Section title="Diagnostic Frameworks">
          {frameworks.map((fw) => (
            <Surface key={fw.id} style={styles.listCard} elevation={2}>
              <Text variant="titleSmall" style={styles.listCardTitle}>
                {fw.name}
              </Text>
              <Text variant="bodySmall" style={styles.listCardMeta}>
                {fw.slug}
              </Text>
            </Surface>
          ))}
        </Section>
      )}

      <Section title={`Members (${members.length})`}>
        {members.map((member) => {
          const user = userMap.get(member.userId);
          const displayName = user?.name || user?.email || "Member";
          const role = ROLE_LABELS[member.role] ?? member.role;
          return (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text variant="titleSmall" style={styles.memberAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text variant="bodyMedium" style={styles.memberName}>
                  {displayName}
                </Text>
                {user?.email && user.name && (
                  <Text variant="bodySmall" style={styles.memberEmail}>
                    {user.email}
                  </Text>
                )}
              </View>
              <Chip
                mode="flat"
                compact
                style={styles.roleBadge}
                textStyle={styles.roleBadgeText}
              >
                {role}
              </Chip>
            </View>
          );
        })}
      </Section>

      <Section title="Actions">
        {isOwner && (
          <Button
            mode="contained"
            onPress={() => router.push({ pathname: "/project-edit", params: { projectId: id } })}
            buttonColor={palette.primary}
            textColor="#ffffff"
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Project
          </Button>
        )}
        {isDefault ? (
          <Surface style={styles.defaultActiveRow} elevation={2}>
            <Text variant="bodyMedium" style={styles.defaultActiveText}>
              This is your default project
            </Text>
          </Surface>
        ) : (
          <Button
            mode="contained"
            onPress={handleSetDefault}
            loading={settingDefault}
            disabled={settingDefault}
            buttonColor={palette.primary}
            textColor="#ffffff"
            style={styles.actionButton}
          >
            Set as Default Project
          </Button>
        )}
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Sub-components ──

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="labelSmall" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text variant="bodyMedium" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
    padding: 24,
  },
  errorText: {
    color: palette.error,
    textAlign: "center",
    marginBottom: 12,
  },

  accentBar: { height: 4 },

  defaultRow: { paddingHorizontal: 16, paddingTop: 12 },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.successBg,
    borderRadius: radius.sm,
  },
  defaultBadgeText: { fontSize: 13, fontWeight: "600", color: palette.success },

  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  infoLabel: { color: palette.textSecondary, flex: 1 },
  infoValue: {
    color: palette.textPrimary,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  infoBlock: { paddingVertical: 10 },
  infoBlockText: { color: palette.textSecondary, marginTop: 4, lineHeight: 20 },

  notesCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 4,
  },
  notesText: { color: palette.textSecondary, lineHeight: 20 },

  // List cards (meds, strategies, frameworks)
  listCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  listCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  listCardTitle: {
    color: palette.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  listCardSub: { color: palette.textSecondary, marginBottom: 2 },
  listCardMeta: { color: palette.textSecondary },
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", color: "#4338CA" },
  emptyItem: { color: palette.textMuted, fontStyle: "italic" },

  // Members
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: { fontWeight: "700", color: palette.primary },
  memberInfo: { flex: 1 },
  memberName: { fontWeight: "600", color: palette.textPrimary },
  memberEmail: { color: palette.textSecondary },
  roleBadge: {
    backgroundColor: palette.borderLight,
    borderRadius: radius.sm,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "500", color: palette.textSecondary },

  // Actions
  defaultActiveRow: {
    backgroundColor: palette.successBg,
    borderRadius: radius.md,
    padding: 14,
  },
  defaultActiveText: { fontWeight: "600", color: palette.success },
  actionButton: {
    borderRadius: radius.md,
    marginBottom: 10,
  },
});
