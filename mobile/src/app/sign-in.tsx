import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Button, ActivityIndicator, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { palette, radius } from "@/lib/theme";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setError("");
    setLoading(true);

    const result = await signIn(email.trim(), password);

    if (!result.success) {
      setError(result.error ?? "Log in failed");
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.logo}>⚡️</Text>
          <Text variant="headlineMedium" style={styles.title}>Storm Tracker</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>Log in to continue</Text>

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              disabled={loading}
              style={styles.input}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              disabled={loading}
              onSubmitEditing={handleSignIn}
              style={styles.input}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />

            {error ? (
              <Text variant="bodyMedium" style={styles.error}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSignIn}
              disabled={loading || !email.trim() || !password}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor={palette.primary}
            >
              Log In
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
    color: palette.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: palette.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: palette.surfaceAlt,
  },
  error: {
    color: palette.error,
    textAlign: "center",
  },
  button: {
    borderRadius: radius.md,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
