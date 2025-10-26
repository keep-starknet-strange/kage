import { AppProviders } from '@/providers/AppProviders';
import { useAccountStore } from "@/stores/accountStore";
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isInitialized, initialize, starknetAccount } = useAccountStore();

    useEffect(() => {
        if (!isInitialized) {
            void initialize()
        } else {
            SplashScreen.hide()
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

            <AccessVaultModal />
            <StatusBar style="auto" />
        </AppProviders>
    );
}
