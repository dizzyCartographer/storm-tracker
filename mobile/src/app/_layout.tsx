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
        <Stack.Screen
          name="log-edit"
          options={{
            headerShown: true,
            headerTitle: "Edit Log",
            headerBackTitle: "Back",
            headerTintColor: palette.primary,
            headerStyle: { backgroundColor: palette.background },
          }}
        />
        <Stack.Screen
          name="project-edit"
          options={{
            headerShown: true,
            headerTitle: "Edit Project",
            headerBackTitle: "Back",
            headerTintColor: palette.primary,
            headerStyle: { backgroundColor: palette.background },
          }}
        />
        </Stack>
        </ProjectProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
