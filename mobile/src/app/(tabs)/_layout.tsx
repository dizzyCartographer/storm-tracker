import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useProject } from "@/lib/project-context";
import { ProjectSelector } from "@/components/project-selector";
import { ProjectLoadError } from "@/components/project-load-error";
import { HeaderMenu } from "@/components/header-menu";
import { palette } from "@/lib/theme";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 64;

function TabLayoutInner() {
  const { isSignedIn } = useAuth();
  const { tenants, selectedTenant, setSelectedTenantId } = useProject();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header — app title + hamburger */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Storm Tracker
        </Text>
        <HeaderMenu />
      </View>

      {/* Project selector */}
      {tenants.length > 1 && (
        <ProjectSelector
          tenants={tenants}
          selectedId={selectedTenant?.id ?? null}
          onSelect={setSelectedTenantId}
        />
      )}

      {/* Accent bar */}
      {selectedTenant?.teenFavoriteColor && (
        <Divider
          style={[
            styles.accentBar,
            { backgroundColor: selectedTenant.teenFavoriteColor },
          ]}
        />
      )}

      {/* ST-077: shared recovery banner — covers every tab that depends on the
          project context, so a failed load is always visible and retryable. */}
      <ProjectLoadError />


      {/* Tab screens render here */}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: palette.primary,
            tabBarInactiveTintColor: palette.textMuted,
            tabBarStyle: {
              height: TAB_BAR_HEIGHT,
              paddingBottom: Platform.OS === "ios" ? 28 : 8,
              paddingTop: 8,
              borderTopColor: palette.borderLight,
              backgroundColor: palette.background,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="log"
            options={{
              title: "Log",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="add-circle-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="import"
            options={{
              title: "AI Journal",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="sparkles-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: "History",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="projects"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return <TabLayoutInner />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 0,
  },
  headerTitle: { fontWeight: "700", color: palette.primary },
  accentBar: { height: 3, marginTop: 8 },
  content: { flex: 1 },
});
