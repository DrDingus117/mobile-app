const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On web, don't load expo-sqlite (it needs special worker setup).
// Tracking and saved records are phone-only, so web never calls it.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'expo-sqlite' || moduleName.startsWith('expo-sqlite/'))
  ) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;