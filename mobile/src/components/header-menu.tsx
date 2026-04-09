import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>☰</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                router.push("/(tabs)/profile");
              }}
            >
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                signOut();
              }}
            >
              <Text style={styles.menuTextDanger}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
  },
  triggerText: {
    fontSize: 22,
    color: "#374151",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 16,
    color: "#374151",
  },
  menuTextDanger: {
    fontSize: 16,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
});
