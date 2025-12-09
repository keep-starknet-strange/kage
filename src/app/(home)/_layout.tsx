import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { defaultScreenOptions } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

export const unstable_settings = {
    // Ensure any route can link back to `/`
    initialRouteName: 'index',
};

export default function WalletLayout() {
    const { t } = useTranslation();
    const screenOptions = defaultScreenOptions();
    return (
        <Tabs
            screenOptions={{ ...screenOptions, headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('navigation.tabs.accounts'),

                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="wallet" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('navigation.tabs.settings'),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="settings" color={color} />,
                }}
            />
        </Tabs>
    );
}
