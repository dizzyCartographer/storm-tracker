import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";
import { useAuth } from "@/lib/auth-context";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 64;

export default function TabLayout() {
  const { isSignedIn } = useAuth();
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

function TabIcon({ label, color }: { label: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20, color }}>{label}</Text>;
}
