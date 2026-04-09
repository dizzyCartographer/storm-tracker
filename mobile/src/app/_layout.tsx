import React from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";
import { ProjectProvider } from "@/lib/project-context";
import { appTheme, palette } from "@/lib/theme";

export default function RootLayout() {
  return (
    <PaperProvider theme={appTheme}>
      <AuthProvider>
        <ProjectProvider>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="entry/[id]"
          options={{
            headerShown: true,
            headerTitle: "Entry Detail",
            headerBackTitle: "Back",
            headerTintColor: palette.primary,
            headerStyle: { backgroundColor: palette.background },
          }}
        />
        <Stack.Screen
          name="project/[id]"
          options={{
            headerShown: true,
            headerTitle: "Project",
            headerBackTitle: "Projects",
            headerTintColor: palette.primary,
            headerStyle: { backgroundColor: palette.background },
          }}
        />
        <Stack.Screen
          name="journal-import"
          options={{
            headerShown: true,
            headerTitle: "Import Journal",
            headerBackTitle: "Back",
            headerTintColor: palette.primary,
            headerStyle: { backgroundColor: palette.background },
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
