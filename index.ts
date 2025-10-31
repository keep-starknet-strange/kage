import 'react-native-get-random-values';
import "@ethersproject/shims" // Might be deleted when getId is moved to kms (delete shims, and ethers)

// Quick-crypto is used for native crypto operations
import { install } from 'react-native-quick-crypto';
install();

// Fallback minimal HKDF/PBKDF2 polyfill — kept after quick-crypto so it doesn't override
import './polyfills/webcrypto';
import 'reflect-metadata';

import 'expo-router/entry'