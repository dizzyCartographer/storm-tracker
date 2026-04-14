import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
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

  // Update header title once tenant name is loaded
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

      // Try to fetch display names for members
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
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  if (error || !tenant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Project not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDefault = currentUser?.defaultTenantId === id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Accent bar */}
      {tenant.teenFavoriteColor && (
        <View
          style={[styles.accentBar, { backgroundColor: tenant.teenFavoriteColor }]}
        />
      )}

      {/* Default badge */}
      {isDefault && (
        <View style={styles.defaultRow}>
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default Project</Text>
          </View>
        </View>
      )}

      {/* Description */}
      {(tenant.description || tenant.purpose) && (
        <Section title="About">
          {tenant.purpose && (
            <InfoRow
              label="Purpose"
              value={PURPOSE_LABELS[tenant.purpose] ?? tenant.purpose}
            />
          )}
          {tenant.description && (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{tenant.description}</Text>
            </View>
          )}
        </Section>
      )}

      {/* Teen Info */}
      <Section title="Teen Info">
        <InfoRow label="Name" value={tenant.teenFullName} />
        <InfoRow label="Nickname" value={tenant.teenNickname} />
        <InfoRow label="Birthday" value={formatDate(tenant.teenBirthday)} />
        {tenant.teenFavoriteColor && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Favorite Color</Text>
            <View style={styles.colorRow}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: tenant.teenFavoriteColor },
                ]}
              />
              <Text style={styles.infoValue}>{tenant.teenFavoriteColor}</Text>
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
            <Text style={styles.infoLabel}>Interests</Text>
            <Text style={styles.infoBlockText}>{tenant.teenInterests}</Text>
          </View>
        )}
      </Section>

      {/* Background */}
      {(tenant.onsetDate || tenant.familyHistory) && (
        <Section title="Background">
          <InfoRow label="Onset / First Suspected" value={formatDate(tenant.onsetDate)} />
          {tenant.familyHistory && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Family History</Text>
              <Text style={styles.infoBlockText}>{tenant.familyHistory}</Text>
            </View>
          )}
        </Section>
      )}

      {/* Medications */}
      <Section title={`Medications (${medications.length})`}>
        {medications.length === 0 ? (
          <Text style={styles.emptyItem}>No medications logged.</Text>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{med.name}</Text>
              {med.dosage && (
                <Text style={styles.listCardSub}>{med.dosage}</Text>
              )}
              {med.frequency && (
                <Text style={styles.listCardMeta}>{med.frequency}</Text>
              )}
              {med.instructions && (
                <Text style={styles.listCardMeta}>{med.instructions}</Text>
              )}
            </View>
          ))
        )}
      </Section>

      {/* Strategies */}
      <Section title={`Strategies (${strategies.length})`}>
        {strategies.length === 0 ? (
          <Text style={styles.emptyItem}>No strategies logged.</Text>
        ) : (
          strategies.map((s) => (
            <View key={s.id} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <Text style={styles.listCardTitle}>{s.name}</Text>
                {s.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {s.category.replace(/_/g, " ")}
                    </Text>
                  </View>
                )}
              </View>
              {s.description && (
                <Text style={styles.listCardMeta}>{s.description}</Text>
              )}
            </View>
          ))
        )}
      </Section>

      {/* Frameworks */}
      {frameworks.length > 0 && (
        <Section title="Diagnostic Frameworks">
          {frameworks.map((fw) => (
            <View key={fw.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{fw.name}</Text>
              <Text style={styles.listCardMeta}>{fw.slug}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Members */}
      <Section title={`Members (${members.length})`}>
        {members.map((member) => {
          const user = userMap.get(member.userId);
          const displayName = user?.name || user?.email || "Member";
          const role = ROLE_LABELS[member.role] ?? member.role;
          return (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{displayName}</Text>
                {user?.email && user.name && (
                  <Text style={styles.memberEmail}>{user.email}</Text>
                )}
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role}</Text>
              </View>
            </View>
          );
        })}
      </Section>

      {/* Actions */}
      <Section title="Actions">
        {isDefault ? (
          <View style={styles.defaultActiveRow}>
            <Text style={styles.defaultActiveText}>
              ✓ This is your default project
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, settingDefault && styles.actionButtonDisabled]}
            onPress={handleSetDefault}
            disabled={settingDefault}
          >
            {settingDefault ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Set as Default Project</Text>
            )}
          </TouchableOpacity>
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
      <Text style={styles.sectionTitle}>{title}</Text>
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
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
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

  accentBar: { height: 4 },

  defaultRow: { paddingHorizontal: 16, paddingTop: 12 },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  defaultBadgeText: { fontSize: 13, fontWeight: "600", color: "#065F46" },

  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
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
    borderBottomColor: "#F9FAFB",
  },
  infoLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoBlock: { paddingVertical: 10 },
  infoBlockText: { fontSize: 14, color: "#374151", marginTop: 4, lineHeight: 20 },

  notesCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  notesText: { fontSize: 14, color: "#374151", lineHeight: 20 },

  // List cards (meds, strategies, frameworks)
  listCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  listCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  listCardSub: { fontSize: 13, color: "#374151", marginBottom: 2 },
  listCardMeta: { fontSize: 13, color: "#6B7280" },
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", color: "#4338CA" },
  emptyItem: { fontSize: 14, color: "#9CA3AF", fontStyle: "italic" },

  // Members
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  memberEmail: { fontSize: 12, color: "#6B7280" },
  roleBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "500", color: "#6B7280" },

  // Actions
  defaultActiveRow: {
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 14,
  },
  defaultActiveText: { fontSize: 14, fontWeight: "600", color: "#065F46" },
  actionButton: {
    backgroundColor: "#374151",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 15, fontWeight: "600", color: "#ffffff" },
});
