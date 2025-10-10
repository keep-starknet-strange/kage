import { PropsWithChildren, useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import * as ScreenCapture from 'expo-screen-capture';
import * as SplashScreen from 'expo-splash-screen';

import { useUserStore } from '../stores/useUserStore';
import { usePrivacyStore } from '../stores/usePrivacyStore';
import { darkTheme, lightTheme } from '../design/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const AppProviders = ({ children }: PropsWithChildren) => {
  const theme = useUserStore((state) => state.theme);
  const screenshotGuard = usePrivacyStore((state) => state.screenshotGuard);

  const resolvedTheme = useMemo(() => (theme === 'dark' ? darkTheme : lightTheme), [theme]);

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
        <ThemeProvider theme={resolvedTheme}>{children}</ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
