import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DynamicSafeAreaProvider } from './DynamicSafeAreaProvider';
import { ThemeProvider } from './ThemeProvider';
import { KeyboardProvider } from "react-native-keyboard-controller";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DynamicSafeAreaProvider>
        <ThemeProvider>
          <KeyboardProvider>
            {children}
          </KeyboardProvider>
        </ThemeProvider>
      </DynamicSafeAreaProvider>
    </GestureHandlerRootView>
  );
};
