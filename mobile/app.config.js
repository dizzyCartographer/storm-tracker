/**
 * Dynamic Expo config — extends app.json with per-profile overrides.
 *
 * APP_ENV is set by EAS build profiles in eas.json:
 *   APP_ENV=staging  → com.stormtracker.dev  / "Storm Tracker Dev"
 *   (unset)          → com.stormtracker.app  / "Storm Tracker"
 */
module.exports = ({ config }) => {
  const isStaging = process.env.APP_ENV === 'staging';

  return {
    ...config,
    name: isStaging ? 'Storm Tracker Dev' : config.name,
    ios: {
      ...config.ios,
      bundleIdentifier: isStaging
        ? 'com.stormtracker.dev'
        : config.ios.bundleIdentifier,
    },
  };
};
