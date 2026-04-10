import { MD3LightTheme, configureFonts } from "react-native-paper";

// ── Mint / Teal Palette ──

export const palette = {
  // Primary teal
  primary: "#0D9488",
  primaryLight: "#5EEAD4",
  primaryFaint: "#CCFBF1",
  primaryContainer: "#F0FDFA",

  // Secondary mint
  secondary: "#10B981",
  secondaryLight: "#6EE7B7",
  secondaryFaint: "#D1FAE5",

  // Surfaces — background is tinted, cards/controls are bright
  background: "#EDF5F4",
  surface: "#F7FBFB",
  surfaceAlt: "#FAFEFE",
  card: "#FFFFFF",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textOnPrimary: "#FFFFFF",

  // Borders
  border: "#D1E8E4",
  borderLight: "#E2F0ED",

  // Semantic
  error: "#DC2626",
  errorBg: "#FEF2F2",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  success: "#059669",
  successBg: "#ECFDF5",
};

// ── Mood Colors (coordinated with mint/teal) ──

export const moodColors: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  MANIC: { bg: "#FDF4E8", text: "#9A5B13", dot: "#D4913A", label: "Manic" },
  DEPRESSIVE: {
    bg: "#E0F2F1",
    text: "#1A5E6C",
    dot: "#3B9DAD",
    label: "Depressive",
  },
  MIXED: { bg: "#EDE5F5", text: "#5E3D8A", dot: "#8A6BBF", label: "Mixed" },
  NEUTRAL: {
    bg: "#EDF5F3",
    text: "#4A6B64",
    dot: "#8FABA4",
    label: "Neutral",
  },
};

// ── Border Radius Scale ──

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 24,
};

// ── Spacing ──

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// ── Paper Theme ──

export const appTheme = {
  ...MD3LightTheme,
  roundness: radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryContainer,
    secondary: palette.secondary,
    secondaryContainer: palette.secondaryFaint,
    background: palette.background,
    surface: palette.surface,
    surfaceVariant: palette.surfaceAlt,
    error: palette.error,
    errorContainer: palette.errorBg,
    onPrimary: palette.textOnPrimary,
    onPrimaryContainer: palette.primary,
    onSecondary: palette.textOnPrimary,
    onSecondaryContainer: palette.secondary,
    onBackground: palette.textPrimary,
    onSurface: palette.textPrimary,
    onSurfaceVariant: palette.textSecondary,
    outline: palette.border,
    outlineVariant: palette.borderLight,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: "#F7FBFB",
      level2: "#FAFEFE",
      level3: "#FCFFFF",
      level4: "#FDFFFF",
      level5: "#FFFFFF",
    },
  },
};
