module.exports = function (api) {
  // Get the platform from the caller (e.g., 'web', 'ios', 'android')
  const platform = api.caller((caller) => caller?.platform);
  const configPlatform = platform === 'web' ? 'web' : 'mobile';
  
  // Cache based on the platform to allow different configs per platform
  api.cache.using(() => configPlatform);
  
  return {
    presets: [
      ["babel-preset-expo"]
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
      'babel-plugin-transform-typescript-metadata',
      
      // Add platform-specific plugins here if needed
      ...(configPlatform === 'web' ? [
        ["@babel/plugin-transform-class-properties", { "loose": true }]
      ] : [
        // Mobile-specific plugins
      ]),

      // Rest of the plugins...
      "react-native-worklets/plugin",
    ],
  };
};