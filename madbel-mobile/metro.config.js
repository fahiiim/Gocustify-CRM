const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get default config
const config = getDefaultConfig(__dirname);

// Add your path configurations FIRST
config.resolver.extraNodeModules = {
  '@': `${__dirname}/src`,
};

config.resolver.alias = {
  '@': './src',
};

// THEN apply NativeWind and export ONCE
module.exports = withNativeWind(config, { input: './global.css' });
