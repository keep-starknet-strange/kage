import { ProfileState } from '@/profile/profileState';
import { AppProviders } from '@/providers/AppProviders';
import { useProfileStore } from '@/stores/profileStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from "react";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { profileState, initialize } = useProfileStore();

    const isOnboarded = useMemo(() => {
        return ProfileState.isOnboarded(profileState)
    }, [profileState])

    useEffect(() => {
        if (!ProfileState.isInitialized(profileState)) {
            console.log("initialize");
            void initialize().then(() => {
                SplashScreen.hide()
            })
        }
    }, [profileState, initialize]);

    return (
        <AppProviders>
            <Stack>
                <Stack.Protected guard={!isOnboarded}>
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={isOnboarded}>
                    <Stack.Screen name="(wallet)" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>

            <AccessVaultModal />
            <StatusBar style="auto" />
        </AppProviders>
    );
}
