import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import SignInScreen from "./sign-in";

export default function Index() {
  const { isLoading, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isLoading, isSignedIn]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  // Brief flash while redirecting
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#374151" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
