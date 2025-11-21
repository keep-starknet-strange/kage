import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { defaultScreenOptions } from '@/providers/ThemeProvider';

export default function WalletLayout() {
    const screenOptions = defaultScreenOptions();
    return (
        <Tabs
            screenOptions={{...screenOptions, headerShown: false}}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accounts',

                    tabBarIcon: ({color}) => <IconSymbol size={28} name="wallet" color={color}/>,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({color}) => <IconSymbol size={28} name="settings" color={color}/>,
                }}
            />
        </Tabs>
    );
}
