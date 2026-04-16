import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Text, ActivityIndicator, Button, Surface } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getTenantById, updateTenantProfile, TenantDetail } from "@/lib/api";
import { palette, radius } from "@/lib/theme";

// ── Constants ──

const PURPOSE_OPTIONS = [
  { value: "ONGOING_TRACKING", label: "Ongoing Tracking" },
  { value: "DIAGNOSTIC_COLLECTION", label: "Diagnostic Collection" },
];

// ── Main Component ──

export default function ProjectEditScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState<string | null>(null);
  const [teenFullName, setTeenFullName] = useState("");
  const [teenNickname, setTeenNickname] = useState("");
  const [teenBirthday, setTeenBirthday] = useState("");
  const [teenFavoriteColor, setTeenFavoriteColor] = useState("");
  const [teenSchool, setTeenSchool] = useState("");
  const [teenFavoriteSubject, setTeenFavoriteSubject] = useState("");
  const [teenInterests, setTeenInterests] = useState("");
  const [teenHasIep, setTeenHasIep] = useState(false);
  const [teenDiagnosis, setTeenDiagnosis] = useState("");
  const [teenOtherHealth, setTeenOtherHealth] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const tenant = await getTenantById(projectId);
        if (!tenant) {
          Alert.alert("Error", "Project not found.");
          return;
        }
        setName(tenant.name ?? "");
        setDescription(tenant.description ?? "");
        setPurpose(tenant.purpose);
        setTeenFullName(tenant.teenFullName ?? "");
        setTeenNickname(tenant.teenNickname ?? "");
        setTeenBirthday(tenant.teenBirthday ? tenant.teenBirthday.split("T")[0] : "");
        setTeenFavoriteColor(tenant.teenFavoriteColor ?? "");
        setTeenSchool(tenant.teenSchool ?? "");
        setTeenFavoriteSubject(tenant.teenFavoriteSubject ?? "");
        setTeenInterests(tenant.teenInterests ?? "");
        setTeenHasIep(tenant.teenHasIep ?? false);
        setTeenDiagnosis(tenant.teenDiagnosis ?? "");
        setTeenOtherHealth(tenant.teenOtherHealth ?? "");
        setOnsetDate(tenant.onsetDate ? tenant.onsetDate.split("T")[0] : "");
        setFamilyHistory(tenant.familyHistory ?? "");
      } catch (e) {
        console.error("Failed to load project:", e);
        Alert.alert("Error", "Could not load project data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  async function handleSave() {
    if (!projectId || !name.trim()) {
      Alert.alert("Validation", "Project name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateTenantProfile(projectId, {
        name: name.trim(),
        description: description.trim() || null,
        purpose: purpose || null,
        teenFullName: teenFullName.trim() || null,
        teenNickname: teenNickname.trim() || null,
        teenBirthday: teenBirthday || null,
        teenFavoriteColor: teenFavoriteColor.trim() || null,
        teenSchool: teenSchool.trim() || null,
        teenFavoriteSubject: teenFavoriteSubject.trim() || null,
        teenInterests: teenInterests.trim() || null,
        teenHasIep: teenHasIep,
        teenDiagnosis: teenDiagnosis.trim() || null,
        teenOtherHealth: teenOtherHealth.trim() || null,
        onsetDate: onsetDate || null,
        familyHistory: familyHistory.trim() || null,
      });
      Alert.alert("Saved", "Project updated successfully.");
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text variant="bodySmall" style={styles.loadingText}>Loading project...</Text>
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
        <Text variant="headlineSmall" style={styles.pageTitle}>Edit Project</Text>

        {/* Project Info */}
        <SectionHeader title="Project Info" />
        <Field label="Project Name *" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />

        <Text variant="labelSmall" style={styles.fieldLabel}>Purpose</Text>
        <View style={styles.pillRow}>
          {PURPOSE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pill,
                purpose === opt.value
                  ? { backgroundColor: palette.primaryFaint, borderColor: palette.primary }
                  : styles.pillInactive,
              ]}
              onPress={() => setPurpose(purpose === opt.value ? null : opt.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  purpose === opt.value ? { color: palette.primary } : styles.pillTextInactive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Teen Info */}
        <SectionHeader title="Teen Info" />
        <Field label="Full Name" value={teenFullName} onChangeText={setTeenFullName} />
        <Field label="Nickname" value={teenNickname} onChangeText={setTeenNickname} />
        <Field
          label="Birthday (YYYY-MM-DD)"
          value={teenBirthday}
          onChangeText={setTeenBirthday}
          placeholder="2010-05-15"
        />
        <Field
          label="Favorite Color (hex)"
          value={teenFavoriteColor}
          onChangeText={setTeenFavoriteColor}
          placeholder="#FF6B9D"
        />
        {teenFavoriteColor ? (
          <View style={styles.colorPreview}>
            <View style={[styles.colorSwatch, { backgroundColor: teenFavoriteColor }]} />
            <Text variant="bodySmall" style={styles.colorHex}>{teenFavoriteColor}</Text>
          </View>
        ) : null}
        <Field label="School" value={teenSchool} onChangeText={setTeenSchool} />
        <Field label="Favorite Subject" value={teenFavoriteSubject} onChangeText={setTeenFavoriteSubject} />
        <Field label="Interests" value={teenInterests} onChangeText={setTeenInterests} multiline />

        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={styles.switchLabel}>Has IEP</Text>
          <Switch
            value={teenHasIep}
            onValueChange={setTeenHasIep}
            trackColor={{ true: palette.primaryLight, false: palette.border }}
            thumbColor={teenHasIep ? palette.primary : palette.textMuted}
          />
        </View>

        <Field label="Diagnosis" value={teenDiagnosis} onChangeText={setTeenDiagnosis} multiline />
        <Field label="Other Health Issues" value={teenOtherHealth} onChangeText={setTeenOtherHealth} multiline />

        {/* Background */}
        <SectionHeader title="Background" />
        <Field
          label="Date of Onset (YYYY-MM-DD)"
          value={onsetDate}
          onChangeText={setOnsetDate}
          placeholder="2024-01-15"
        />
        <Field label="Family History" value={familyHistory} onChangeText={setFamilyHistory} multiline />

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saving || !name.trim()}
          loading={saving}
          buttonColor={palette.primary}
          textColor="#ffffff"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonText}
        >
          Save Changes
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──

function SectionHeader({ title }: { title: string }) {
  return <Text variant="titleSmall" style={styles.sectionHeader}>{title}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text variant="labelSmall" style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
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
  },
  loadingText: { marginTop: 8, color: palette.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 16,
  },

  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 12,
  },

  fieldContainer: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceAlt,
  },
  fieldMultiline: {
    minHeight: 80,
  },

  // Purpose pills
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

  // Color preview
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  colorHex: { color: palette.textSecondary },

  // IEP switch
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    marginBottom: 14,
  },
  switchLabel: { color: palette.textSecondary },

  // Save
  saveButton: { borderRadius: radius.md, marginTop: 12 },
  saveButtonContent: { paddingVertical: 6 },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});
