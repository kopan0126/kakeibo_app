const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js の OpenTelemetry 動的インポートが
// Hermes (React Native JS エンジン) と互換性がないため無効化
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
