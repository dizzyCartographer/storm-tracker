# Branding & Style Guide

## Identity

- **Name:** Storm Tracker

- **Tagline:** _(TBD)_

- **Tone:** Calm, supportive. Never alarmist. The app handles sensitive data — the UI should feel steady and trustworthy.

***

## Design Philosophy (April 9, 2026)

### Core principle: the app is a safe space.

Not just a tracking tool — a place a parent goes after a hard day with their teen. The emotional experience of using the app matters as much as the functionality. Every design decision should reduce friction, not add it.

### Platform-native feel.

The app must feel native to whatever OS it's on. iOS should feel like an Apple app. Android (future) should feel like an Android app. Apps that don't feel like Apple apps on iOS are a friction point — avoid Material Design patterns on iOS.

### Theming vision: curated presets, not just a color picker.

Deep visual customization per project. The user should feel like _their_ app, not a generic tool. Themes transform the whole app — colors, border treatments, visual motifs, background texture — not just an accent color swap.

**Example presets to eventually build:**

- **Watercolor** — soft, calming, artistic. Suits a parent who finds that aesthetic therapeutic.

- **Anime** — bolder lines, more vibrant. Suits a teen self-tracking with their own aesthetic preferences.

The customization is a retention and engagement strategy. "I want them to love using it, not go 'oh I've got to track my thing.'"

### Open design questions (not yet decided)

- What exactly changes per theme: colors only? border radius? shadows? typography? background textures/patterns?

- How many themes ship by default vs. user-created?

- Does each project get its own theme, or is it account-wide?

- Can users create custom themes or only pick from presets?

***

## Mobile Design System

### Status: library NOT yet selected (as of April 9, 2026)

**Decision must happen before any mobile UI code is written.** The user is evaluating demo apps visually before committing. Do not build UI against any specific library until this decision is made and documented here.

### Requirements

- Works on both iOS and Android from the same codebase (Android is planned, not just iOS)

- Strong built-in accessibility (customers with disability is an explicit use case)

- Supports deep theming — not just a color token swap, but real visual transformation

- Feels native on iOS; 

### Libraries evaluated

| Library                                     | Strengths                                               | Concerns                                            |
| ------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Gluestack UI v3 + NativeWind + Reanimated 4 | Headless, full creative control, best for custom themes | More setup, fewer out-of-box components             |
| React Native Paper                          | Best accessibility out of box, Material Design 3        | Looks "Google-ish" — conflicts with iOS-native goal |
| UI Kitten (Eva Design System)               | Polished, good theming, premium feel                    | Smaller community                                   |
| Tamagui                                     | Universal (web + native), performance-focused           | Complexity                                          |

User is downloading demo apps (Paper, UI Kitten) to evaluate visual feel before deciding.

## ## Colors

_Define primary, secondary, accent, and semantic colors here._

| Role       | Color  | Hex    | Usage                          |
| ---------- | ------ | ------ | ------------------------------ |
| Primary    | <br /> | <br /> | <br />                         |
| Secondary  | <br /> | <br /> | <br />                         |
| Accent     | <br /> | <br /> | <br />                         |
| Manic      | <br /> | <br /> | Manic-related UI elements      |
| Depressive | <br /> | <br /> | Depressive-related UI elements |
| Mixed      | <br /> | <br /> | Mixed state UI elements        |
| Neutral    | <br /> | <br /> | Neutral / baseline             |
| Danger     | <br /> | <br /> | Safety concerns, alerts        |

## Typography

_Define font families, sizes, and weights._

| Element        | Font   | Size   | Weight |
| -------------- | ------ | ------ | ------ |
| Headings       | <br /> | <br /> | <br /> |
| Body           | <br /> | <br /> | <br /> |
| Labels / Caps  | <br /> | <br /> | <br /> |
| Data / Numbers | <br /> | <br /> | <br /> |

## Components

_Document recurring UI patterns and how they should look/feel._

### Cards

### Buttons

### Badges / Pills

### Charts

### Forms

## Iconography

_Icon style, library, and usage guidelines._

## Logo

_Logo files, usage rules, minimum sizes._

## Mobile Considerations

_Mobile-specific design decisions (touch targets, spacing, gestures)._
