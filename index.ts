import 'react-native-get-random-values';

import 'react-native-quick-crypto';
// Fallback minimal HKDF/PBKDF2 polyfill — kept after quick-crypto so it doesn't override
import './polyfills/webcrypto';
import 'reflect-metadata';

import 'expo-router/entry'