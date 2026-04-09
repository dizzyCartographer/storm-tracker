import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth";
import { getCurrentUserInfo, CurrentUser } from "@/lib/api";

export default function ProfileScreen() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Display name
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Password change
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
      // Fall back to session data only
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#374151" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
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
          {/* Account */}
          <Section title="Account">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email ?? "—"}</Text>
            </View>
          </Section>

          {/* Display Name */}
          <Section title="Display Name">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameSaved(false);
              }}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={[
                styles.button,
                (!name.trim() || savingName) && styles.buttonDisabled,
              ]}
              onPress={handleSaveName}
              disabled={!name.trim() || savingName}
            >
              {savingName ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : nameSaved ? (
                <Text style={styles.buttonText}>Saved ✓</Text>
              ) : (
                <Text style={styles.buttonText}>Save Name</Text>
              )}
            </TouchableOpacity>
          </Section>

          {/* Change Password */}
          <Section title="Change Password">
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={(v) => {
                setCurrentPassword(v);
                setPasswordError(null);
              }}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.inputSpaced]}
              value={newPassword}
              onChangeText={(v) => {
                setNewPassword(v);
                setPasswordError(null);
              }}
              placeholder="New password (min 8 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.inputSpaced]}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setPasswordError(null);
              }}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleChangePassword}
            />

            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!currentPassword || !newPassword || !confirmPassword || savingPassword) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                savingPassword
              }
            >
              {savingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : passwordSaved ? (
                <Text style={styles.buttonText}>Password Updated ✓</Text>
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

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

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  infoLabel: { fontSize: 14, color: "#6B7280" },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500" },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  inputSpaced: { marginTop: 10 },

  errorText: {
    fontSize: 13,
    color: "#DC2626",
    marginTop: 8,
    marginBottom: 4,
  },

  button: {
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: "600", color: "#ffffff" },

});
