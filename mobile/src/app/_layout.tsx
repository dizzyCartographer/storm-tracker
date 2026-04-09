import React from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";
import { appTheme, palette } from "@/lib/theme";

export default function RootLayout() {
  return (
    <PaperProvider theme={appTheme}>
      <AuthProvider>
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
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}
