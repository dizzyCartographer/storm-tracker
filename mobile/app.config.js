/**
 * Dynamic Expo config — extends app.json with per-profile overrides.
 *
 * APP_ENV controls which build target is generated:
 *   APP_ENV=staging  → com.stormtracker.dev  / "StormTrackRx Dev" / dev icon
 *   (unset)          → com.stormtracker.app  / "StormTrackRx"     / prod icon
 *
 * Local Xcode builds:
 *   APP_ENV=staging LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean
 *   LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --platform ios --clean   (production)
 */
module.exports = ({ config }) => {
  const isStaging = process.env.APP_ENV === 'staging';

  const icon = isStaging
    ? './assets/images/icon-dev.png'
    : './assets/images/icon.png';

  const splashIcon = isStaging
    ? './assets/images/splash-icon-dev.png'
    : './assets/images/splash-icon.png';

  return {
    ...config,
    name: isStaging ? 'StormTrackRx Dev' : 'StormTrackRx',
    icon,
    ios: {
      ...config.ios,
      bundleIdentifier: isStaging
        ? 'com.stormtracker.dev'
        : 'com.stormtracker.app',
      icon,
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0D9488',
          image: splashIcon,
          imageWidth: 200,
          android: {
            image: splashIcon,
            imageWidth: 200,
          },
        },
      ],
      'expo-secure-store',
    ],
  };
};
