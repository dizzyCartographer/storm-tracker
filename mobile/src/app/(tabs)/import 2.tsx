import { useEffect } from "react";
import { useRouter } from "expo-router";

// Placeholder — the tab press listener in _layout.tsx intercepts and navigates
// to /journal-import before this screen renders. This file exists only because
// Expo Router requires a file for each tab.
export default function ImportRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journal-import");
  }, []);
  return null;
}
