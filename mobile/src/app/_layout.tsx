import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
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
      </Stack>
    </AuthProvider>
  );
}
