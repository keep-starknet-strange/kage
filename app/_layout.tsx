import { AppProviders } from '@/providers/AppProviders';
import { useAccountStore } from "@/stores/useAccountStore";
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isInitialized, initialize, starknetAccount } = useAccountStore();

    useEffect(() => {
        if (!isInitialized) {
            void initialize().then(() => {
                SplashScreen.hide();
            });
        }
    }, [isInitialized, initialize]);

    if (!isInitialized) return null;

    return (
        <AppProviders>
            <Stack>
                <Stack.Protected guard={starknetAccount === null}>
                    <Stack.Screen name="welcome" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={starknetAccount !== null}>
                    <Stack.Screen name="(wallet)" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>

            <StatusBar style="auto" />
        </AppProviders>
    );
}
