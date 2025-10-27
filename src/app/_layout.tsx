import { AppProviders } from '@/providers/AppProviders';
import { useAccountStore } from "@/stores/accountStore";
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from "react";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';
import { useProfileStore } from '@/stores/profileStore';
import { ProfileState } from '@/profile/profileState';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { profileState, initialize } = useProfileStore();

    const isOnboarded = useMemo(() => {
        return ProfileState.isOnboarded(profileState)
    }, [profileState])

    useEffect(() => {
        if (!ProfileState.isInitialized(profileState)) {
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
