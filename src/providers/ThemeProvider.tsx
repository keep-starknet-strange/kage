import { darkColorTokens, lightColorTokens } from '@/design/tokens';
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

type ColorTokens = typeof lightColorTokens | typeof darkColorTokens;

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    colors: ColorTokens;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeMode>('auto');

    // Determine if dark mode should be active
    const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');

    // Get the appropriate color tokens
    const colors = isDark ? darkColorTokens : lightColorTokens;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export interface StyleSheetFactory<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>> {
    factory: (colorTokens: ColorTokens) => T;
}

export namespace ThemedStyleSheet {
    type NamedStyles<T> = StyleSheet.NamedStyles<T>;

    // Implementation
    export function create<T extends NamedStyles<T> | NamedStyles<any>>(
        factory: (colors: ColorTokens) => T & NamedStyles<T>,
    ): StyleSheetFactory<T> {
        return {
            factory: factory,
        };
    }
}

export const useThemedStyle = <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
    styleFactory: StyleSheetFactory<T>
) => {
    const { colors } = useTheme();

    return useMemo(() => {
        console.log('Setting up stylesheet', colors);
        return styleFactory.factory(colors);
    }, [colors]);
}
