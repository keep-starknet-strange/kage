import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { DynamicSafeAreaProvider } from './DynamicSafeAreaProvider';

export const AppProviders = ({ children }: PropsWithChildren) => {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DynamicSafeAreaProvider>
        {/* TODO adjust based on Abdel's theme props */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {children}
        </ThemeProvider>
      </DynamicSafeAreaProvider>
    </GestureHandlerRootView>
  );
};
