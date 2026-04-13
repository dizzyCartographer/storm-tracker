/**
 * Dynamic Expo config — extends app.json with per-profile overrides.
 *
 * APP_ENV controls which build target is generated:
 *   APP_ENV=staging  → com.stormtracker.dev  / "StormTrackRx Dev"
 *   (unset)          → com.stormtracker.app  / "StormTrackRx"
 *
 * For local Xcode builds:
 *   APP_ENV=staging npx expo prebuild --platform ios --clean
 *   npx expo prebuild --platform ios --clean   (production)
 */
module.exports = ({ config }) => {
  const isStaging = process.env.APP_ENV === 'staging';

  return {
    ...config,
    name: isStaging ? 'StormTrackRx Dev' : 'StormTrackRx',
    ios: {
      ...config.ios,
      bundleIdentifier: isStaging
        ? 'com.stormtracker.dev'
        : 'com.stormtracker.app',
    },
  };
};
