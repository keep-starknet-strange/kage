const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ethers' && (platform === 'ios' || platform === 'android')) {
    return context.resolveRequest(context, 'ethers/lib.esm/index.js', platform);
  }

  if (moduleName === 'crypto' && (platform === 'ios' || platform === 'android')) {
    // when importing crypto, resolve to react-native-quick-crypto
    return context.resolveRequest(
      context,
      'react-native-quick-crypto',
      platform,
    )
  }
  // otherwise chain to the standard Metro resolver.
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config;
