import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

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
    backgroundColor: "#ffffff",
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
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  error: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleLabel: {
    fontSize: 14,
  },
});
