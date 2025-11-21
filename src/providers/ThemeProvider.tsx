import { fontTokens, ztarknetColorTokens } from '@/design/tokens';
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

type ThemeMode = 'ztarknet'; // Currently only ztarknet theme is supported

type ColorTokens = typeof ztarknetColorTokens;

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
    // const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeMode>('ztarknet');

    const colors = ztarknetColorTokens;
    const isDark = true;

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
        return styleFactory.factory(colors);
    }, [colors]);
}

export const defaultScreenOptions = () => {
    const { colors } = useTheme();

    return {
        headerStyle: {
            backgroundColor: colors['bg.default'],
        },
        headerTintColor: colors['text.primary'],
        headerTitleStyle: {
            color: colors['text.primary'],
            fontFamily: fontTokens.ubuntuMono.bold,
        },
        contentStyle: {
            backgroundColor: colors['bg.default'],
        },
        tabBarActiveTintColor: colors['text.primary'],
        tabBarInactiveTintColor: colors['text.muted'],
        tabBarLabelStyle: {
            fontFamily: fontTokens.ubuntuMono.bold,
            fontSize: 12,
        },
        tabBarStyle: {
            backgroundColor: colors['bg.default'],
            borderTopWidth: 1,
            borderTopColor: colors['border.subtle'],
        },
    };
}