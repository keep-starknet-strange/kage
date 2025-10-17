import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export const AppProviders = ({ children }: PropsWithChildren) => {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* TODO adjust based on Abdel's theme props */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>{children}</ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
