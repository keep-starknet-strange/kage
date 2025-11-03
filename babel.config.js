module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {
        "decorators": false
      }]
    ],
    plugins: [
      'babel-plugin-transform-typescript-metadata',
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
      ["@babel/plugin-proposal-class-properties", { "loose": true }],
      ["@babel/plugin-transform-class-properties", { "loose": true }]

      // Rest of the plugins...
    ],
  };
};