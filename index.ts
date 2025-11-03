import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  require('./polyfills/web');
} else if (Platform.OS === 'ios' || Platform.OS === 'android') {
  require('./polyfills/mobile');
}

import 'expo-router/entry';