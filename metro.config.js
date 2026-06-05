const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js の OpenTelemetry 動的インポートが
// Hermes (React Native JS エンジン) と互換性がないため無効化
config.resolver.unstable_enablePackageExports = false;

// PostHog v4 が使うサブパスエクスポートを手動解決
// (unstable_enablePackageExports=false のため exports フィールドが無視される)
const posthogSubpaths = {
  '@posthog/core/surveys': path.resolve(__dirname, 'node_modules/@posthog/core/dist/surveys/index.js'),
  '@posthog/core/error-tracking': path.resolve(__dirname, 'node_modules/@posthog/core/dist/error-tracking/index.js'),
  '@posthog/core/utils': path.resolve(__dirname, 'node_modules/@posthog/core/dist/utils/index.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (posthogSubpaths[moduleName]) {
    return { type: 'sourceFile', filePath: posthogSubpaths[moduleName] };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
