import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, Button, ActivityIndicator, TextInput, Surface } from "react-native-paper";
import { authClient } from "@/lib/auth";
import { getCurrentUserInfo, CurrentUser } from "@/lib/api";
import { palette, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const u = await getCurrentUserInfo();
      setUser(u);
      setName(u?.name ?? "");
    } catch {
      const session = await authClient.getSession();
      if (session.data?.user) {
        const u = {
          id: session.data.user.id,
          name: session.data.user.name ?? null,
          email: session.data.user.email,
          defaultTenantId: null,
        };
        setUser(u);
        setName(u.name ?? "");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    try {
      setSavingName(true);
      setNameSaved(false);
      await authClient.updateUser({ name: name.trim() });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch {
      Alert.alert("Error", "Failed to update display name.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaved(false);

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (result.error) {
        setPasswordError(result.error.message ?? "Failed to change password.");
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch {
      setPasswordError("Failed to change password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>Profile</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="Account">
            <Surface style={styles.infoCard} elevation={2}>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Email</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{user?.email ?? "—"}</Text>
              </View>
            </Surface>
          </Section>

          <Section title="Display Name">
            <TextInput
              mode="outlined"
              label="Your name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameSaved(false);
              }}
              placeholder="Your name"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              style={styles.input}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />
            <Button
              mode="contained"
              onPress={handleSaveName}
              disabled={!name.trim() || savingName}
              loading={savingName}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={palette.primary}
            >
              {nameSaved ? "Saved" : "Save Name"}
            </Button>
          </Section>

          <Section title="Change Password">
            <TextInput
              mode="outlined"
              label="Current password"
              value={currentPassword}
              onChangeText={(v) => {
                setCurrentPassword(v);
                setPasswordError(null);
              }}
              placeholder="Current password"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.input}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />
            <TextInput
              mode="outlined"
              label="New password (min 8 characters)"
              value={newPassword}
              onChangeText={(v) => {
                setNewPassword(v);
                setPasswordError(null);
              }}
              placeholder="New password (min 8 characters)"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.input, styles.inputSpaced]}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />
            <TextInput
              mode="outlined"
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setPasswordError(null);
              }}
              placeholder="Confirm new password"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleChangePassword}
              style={[styles.input, styles.inputSpaced]}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />

            {passwordError && (
              <Text variant="bodySmall" style={styles.errorText}>{passwordError}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleChangePassword}
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                savingPassword
              }
              loading={savingPassword}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={palette.primary}
            >
              {passwordSaved ? "Password Updated" : "Change Password"}
            </Button>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="labelSmall" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

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

  infoCard: {
    borderRadius: radius.md,
    backgroundColor: palette.card,
    padding: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  infoLabel: { color: palette.textSecondary },
  infoValue: { color: palette.textPrimary, fontWeight: "500" },

  input: {
    backgroundColor: palette.surfaceAlt,
  },
  inputSpaced: { marginTop: 10 },

  errorText: {
    color: palette.error,
    marginTop: 8,
    marginBottom: 4,
  },

  button: {
    borderRadius: radius.md,
    marginTop: 12,
  },
  buttonContent: {
    paddingVertical: 4,
  },
});
