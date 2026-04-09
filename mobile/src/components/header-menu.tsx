import React, { useState } from "react";
import { View } from "react-native";
import { Menu, Divider, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { palette } from "@/lib/theme";

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <IconButton icon="menu" iconColor={palette.primary} onPress={() => setOpen(true)} />
        }
      >
        <Menu.Item
          onPress={() => {
            setOpen(false);
            router.push("/(tabs)/projects");
          }}
          title="Projects"
        />
        <Menu.Item
          onPress={() => {
            setOpen(false);
            router.push("/(tabs)/profile");
          }}
          title="Profile"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            setOpen(false);
            signOut();
          }}
          title="Log Out"
        />
      </Menu>
    </View>
  );
}
