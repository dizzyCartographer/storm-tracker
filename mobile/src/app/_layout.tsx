import React from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="entry/[id]"
          options={{
            headerShown: true,
            headerTitle: "Entry Detail",
            headerBackTitle: "Back",
            headerTintColor: "#374151",
            headerStyle: { backgroundColor: "#ffffff" },
          }}
        />
        <Stack.Screen
          name="project/[id]"
          options={{
            headerShown: true,
            headerTitle: "Project",
            headerBackTitle: "Projects",
            headerTintColor: "#374151",
            headerStyle: { backgroundColor: "#ffffff" },
          }}
        />
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}
