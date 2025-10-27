import { Stack } from 'expo-router';
import React from 'react';


export default function OnboaringLayout() {
    return (
        <Stack>
            <Stack.Screen name='index' options={{ headerShown: false }} />
            <Stack.Screen name='set-passphrase' />
        </Stack>
    );
}
