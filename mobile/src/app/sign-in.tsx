import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { palette, radius } from "@/lib/theme";

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }

    setError("");
    setLoading(true);

    const result = isSignUp
      ? await signUp(email.trim(), password, name.trim())
      : await signIn(email.trim(), password);

    if (!result.success) {
      setError(result.error ?? (isSignUp ? "Sign up failed" : "Log in failed"));
    }

    setLoading(false);
  }

  function toggleMode() {
    setMode(isSignUp ? "sign-in" : "sign-up");
    setError("");
    setConfirmPassword("");
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
          <Text variant="bodyLarge" style={styles.subtitle}>
            {isSignUp ? "Create your account" : "Log in to continue"}
          </Text>

          <View style={styles.form}>
            {isSignUp && (
              <TextInput
                mode="outlined"
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                disabled={loading}
                style={styles.input}
                outlineColor={palette.border}
                activeOutlineColor={palette.primary}
              />
            )}

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
              placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
              secureTextEntry
              textContentType={isSignUp ? "newPassword" : "password"}
              disabled={loading}
              onSubmitEditing={isSignUp ? undefined : handleSubmit}
              style={styles.input}
              outlineColor={palette.border}
              activeOutlineColor={palette.primary}
            />

            {isSignUp && (
              <TextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry
                textContentType="newPassword"
                disabled={loading}
                onSubmitEditing={handleSubmit}
                style={styles.input}
                outlineColor={palette.border}
                activeOutlineColor={palette.primary}
              />
            )}

            {error ? (
              <Text variant="bodyMedium" style={styles.error}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor={palette.primary}
            >
              {isSignUp ? "Create Account" : "Log In"}
            </Button>

            <Button
              mode="text"
              onPress={toggleMode}
              disabled={loading}
              textColor={palette.primary}
              labelStyle={styles.toggleLabel}
            >
              {isSignUp
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
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
  toggleLabel: {
    fontSize: 14,
  },
});
