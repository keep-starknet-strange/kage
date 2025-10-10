import { PropsWithChildren, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui';
import * as ScreenCapture from 'expo-screen-capture';
import * as SplashScreen from 'expo-splash-screen';

import { useUserStore } from '../stores/useUserStore';
import { usePrivacyStore } from '../stores/usePrivacyStore';
import config from '../tamagui.config';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const AppProviders = ({ children }: PropsWithChildren) => {
  const theme = useUserStore((state) => state.theme);
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
        <TamaguiProvider config={config} defaultTheme={theme}>
          <Theme name={theme}>{children}</Theme>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
