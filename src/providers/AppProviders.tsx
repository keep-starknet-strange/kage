import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DynamicSafeAreaProvider } from './DynamicSafeAreaProvider';
import { ThemeProvider } from './ThemeProvider';


export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DynamicSafeAreaProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </DynamicSafeAreaProvider>
    </GestureHandlerRootView>
  );
};
