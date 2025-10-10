module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'tamagui',
        {
          config: './tamagui.config.ts',
          components: ['tamagui'],
        },
      ],
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
