import { defaultScreenOptions } from '@/providers/ThemeProvider';
import { Stack } from 'expo-router';
import React from 'react';

export const unstable_settings = {
    // Ensure any route can link back to `/`
    initialRouteName: 'index',
};


export default function OnboaringLayout() {
    const screenOptions = defaultScreenOptions();
    return (
        <Stack screenOptions={screenOptions}>
            <Stack.Screen name='index' options={{ headerShown: false }} />
            <Stack.Screen name='set-passphrase' />
            <Stack.Screen name='create-first-account' />
            <Stack.Screen name='restore-seed-phrase' />
            <Stack.Screen name='restore-wallet' />
        </Stack>
    );
}
