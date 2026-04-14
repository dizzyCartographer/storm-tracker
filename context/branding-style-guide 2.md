# Branding & Style Guide

## Identity

- **Name:** StormTrackRx (App Store) / Storm Tracker (internal/display)
- **Bundle IDs:** `com.stormtracker.app` (production), `com.stormtracker.dev` (staging)
- **Tone:** Calm, supportive. Never alarmist. The app handles sensitive data — the UI should feel steady and trustworthy.

## Design Philosophy

### The app is a safe space.

Not just a tracking tool — a place a parent goes after a hard day with their teen. Every design decision should reduce friction, not add it.

### Platform-native feel.

iOS should feel like an Apple app. Avoid Material Design patterns on iOS. Android (future) should feel like an Android app.

### Deeply personal customization.

Per-project theming via the teen's favorite color. The user should feel like *their* app, not a generic tool. Future vision includes curated theme presets (Watercolor, Anime, etc.) that transform the whole app.

---

## Mobile UI Library

**React Native Paper v5.15** (Material Design 3 components, customized for iOS feel)

Components in use: Card, Chip, Button, TextInput, Text, Surface, Menu, Divider, List.Accordion

**Decision status:** In production use but not formally evaluated against alternatives. See ST-048.

**Other key dependencies:**
- `expo-router ~55.0.8` — file-based navigation
- `react-native-reanimated 4.2.1` — animations
- `expo-symbols ~55.0.5` — icon library
- `react-native 0.83.4` / `react 19.2.0`

---

## Color Palette

All colors defined in `mobile/src/lib/theme.ts`.

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0D9488` | Primary teal — buttons, active states, accents |
| `primaryLight` | `#5EEAD4` | Lighter teal — hover states, secondary elements |
| `primaryFaint` | `#CCFBF1` | Very light teal — selected backgrounds |
| `primaryContainer` | `#F0FDFA` | Barely-there teal — container backgrounds |
| `secondary` | `#10B981` | Mint green — success states, secondary actions |
| `secondaryLight` | `#6EE7B7` | Light mint |
| `secondaryFaint` | `#D1FAE5` | Very light mint |

### Surface & Background

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#EDF5F4` | Main app background (teal-tinted, darker than cards) |
| `surface` | `#F7FBFB` | Card/control backgrounds |
| `surfaceAlt` | `#FAFEFE` | Alternative surface |
| `card` | `#FFFFFF` | Pure white card backgrounds |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#0F172A` | Dark slate — main text |
| `textSecondary` | `#475569` | Medium gray — secondary text |
| `textMuted` | `#94A3B8` | Light gray — hints, placeholders |
| `textOnPrimary` | `#FFFFFF` | White — text on primary backgrounds |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#D1E8E4` | Standard borders |
| `borderLight` | `#E2F0ED` | Lighter dividers |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#DC2626` | Error states |
| `errorBg` | `#FEF2F2` | Error background |
| `warning` | `#D97706` | Warnings, amber states |
| `warningBg` | `#FFFBEB` | Warning background |
| `success` | `#059669` | Success states |
| `successBg` | `#ECFDF5` | Success background |

### Mood Colors (Clinical Context)

Coordinated with the mint/teal palette. Used for classification indicators throughout the app.

| Mood | Background | Text | Dot | Label |
|------|-----------|------|-----|-------|
| Manic | `#FDF4E8` | `#9A5B13` | `#D4913A` | Warm amber/tan |
| Depressive | `#E0F2F1` | `#1A5E6C` | `#3B9DAD` | Teal/cyan |
| Mixed | `#EDE5F5` | `#5E3D8A` | `#8A6BBF` | Purple |
| Neutral | `#EDF5F3` | `#4A6B64` | `#8FABA4` | Sage green |

---

## Typography

React Native Paper's Material Design 3 type scale with system fonts (San Francisco on iOS).

| Variant | Usage | Weight |
|---------|-------|--------|
| `displaySmall` | Logo emoji, large decorative text | — |
| `headlineMedium` | Page titles (sign-in) | 700 (bold) |
| `headlineSmall` | Section headings, "Storm Tracker" header | 700 |
| `titleMedium` | Card titles, month labels | 500 |
| `titleSmall` | Subsection headers | 500 |
| `bodyLarge` | Subtitle text | — |
| `bodyMedium` | Standard paragraph text | — |
| `bodySmall` | Secondary content, metadata | — |
| `labelSmall` | Badges, tags, pill text | — |
| `labelMedium` | Button labels | 600 |

---

## Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 6px | Minimal rounding |
| `sm` | 8px | Small elements (chips, pills) |
| `md` | 12px | Standard cards, buttons |
| `lg` | 16px | Large containers |
| `pill` | 24px | Fully rounded pill shapes |

---

## Spacing Scale

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |

---

## Component Patterns

### Cards

- `Surface` component from React Native Paper, elevation 2-3
- Background: `palette.card` (white)
- Border radius: `radius.md` (12px)
- Shadow: subtle iOS native shadow (opacity 0.08-0.14)

### Pills / Toggles

- `TouchableOpacity` with native shadows (not Paper Surface — Surface causes oval artifacts on pills)
- Border radius: `radius.pill` (24px) for mood/quality, `radius.md` (12px) for behavior criteria
- Active state: solid background color with darker border
- Inactive state: white background with light border
- Padding: 14px horizontal, 6px vertical
- Font: 500 weight, 14px

### Collapsible Sections

- `List.Accordion` from Paper
- Title: 700 weight, secondary text color
- Chevron rotation animation via `react-native-reanimated`
- Count badges on section headers

### Buttons

- Primary: Paper `Button` mode="contained", primary teal background, 16px label, 600 weight
- Full-width on forms

### Text Inputs

- Paper `TextInput` mode="outlined"
- Background: `surfaceAlt`
- Border: `palette.border`, active: `palette.primary`

---

## Navigation Structure (Mobile)

### Bottom Tab Bar (4 visible tabs)

1. **Dashboard** — `grid-outline` icon — recent entries, signals, episodes, suggestions
2. **Log** — `add-circle-outline` icon — daily mood/behavior entry form
3. **AI Journal** — `sparkles-outline` icon — redirects to journal import modal
4. **History** — `calendar-outline` icon — calendar view with mood dots

### Hidden (via hamburger menu)

- Import Journal, Projects, Profile, Log Out

### Header

- "Storm Tracker" title in `headlineSmall`, bold, primary teal
- Hamburger menu button (tinted primary)
- Project selector (horizontal scrolling pills below header)
- Optional accent bar (3px, teen's favorite color)

### Tab Bar Styling

- Active tint: `palette.primary` (teal)
- Inactive tint: `palette.textMuted`
- Background: `palette.background`
- iOS height: 88px, Android: 64px
- Label font: 600 weight, 12px

---

## Logo

SVG `Logo` component: cloud outline with solid lightning bolt. Accepts `accentColor` prop — changes color per project's teen favorite color. Defaults to gray-800 when no color set. Renders in nav alongside "Storm Tracker" text.

**App icons and splash screen:** Not yet designed. See ST-045.

---

## Web UI

### Library

- **Tailwind CSS v4.2** — utility-first CSS
- **Recharts v3.8** — wave graph and frequency chart

### Status

The web app predates the mobile design system. It uses Tailwind utility classes directly, not a component library. Visual patterns are functional but not polished. Web may or may not be sunset; both must work. New web features are deprioritized.

---

## Open Design Decisions

- **Theme presets** — What changes per theme: colors only? Border radius? Shadows? Typography? Background textures? (See ST-014)
- **Per-project vs account-wide themes** — Each project gets its own theme, or is it global?
- **Custom vs preset themes** — Can users create custom themes or only pick from presets?
- **Web design system** — Web uses Tailwind directly. If web continues, it needs a proper design system.
