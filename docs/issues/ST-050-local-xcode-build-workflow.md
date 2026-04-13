---
id: ST-050
title: Set up local Xcode build workflow (replace EAS cloud builds)
type: enhancement
status: done
priority: high
urgency: blocking
components:
  - mobile
  - infrastructure
source: session
created: 2026-04-10
completed: 2026-04-13
dev-plan-ref:
---

Replace EAS cloud builds with local Xcode builds to eliminate queue times and build ceilings.

## Workflow

```bash
cd mobile

# 1. Regenerate native project (only needed after native dependency changes)
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean

# 2. Archive from command line (automatic signing)
xcodebuild archive \
  -workspace ios/StormTrackRx.xcworkspace \
  -scheme StormTrackRx \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath ~/Library/Developer/Xcode/Archives/StormTrackRx.xcarchive \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=RC99K6SXQX

# 3. Distribute via Xcode: Window → Organizer → Distribute App → App Store Connect
```

## Key details

- `appleTeamId` and `buildNumber` set in `app.json` so prebuild generates correct project settings
- Bump `buildNumber` in `app.json` before each TestFlight submission
- `ios/` directory is gitignored — regenerated fresh via `expo prebuild`
- `LANG`/`LC_ALL` env vars fix CocoaPods UTF-8 encoding error
- Archive uses automatic signing with development cert; Xcode re-signs with distribution cert during export
- Certificates must be in sync between Keychain and developer.apple.com
- Delete duplicate/revoked certs from Keychain if distribution fails
