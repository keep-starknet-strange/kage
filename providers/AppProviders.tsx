import { PropsWithChildren, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import * as ScreenCapture from 'expo-screen-capture';
import * as SplashScreen from 'expo-splash-screen';

import { usePrivacyStore } from '../stores/usePrivacyStore';
import { appTheme } from '../design/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const AppProviders = ({ children }: PropsWithChildren) => {
  const screenshotGuard = usePrivacyStore((state) => state.screenshotGuard);

  useEffect(() => {
    if (screenshotGuard) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    }
  }, [screenshotGuard]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider theme={appTheme}>{children}</ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
