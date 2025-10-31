import { ProfileState } from '@/profile/profileState';
import { AppProviders } from '@/providers/AppProviders';
import { useAppDependenciesStore } from '@/stores/appDependenciesStore';
import { useProfileStore } from '@/stores/profileStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from "react";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import Account from '@/profile/account';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { profileState, initialize } = useProfileStore();
    const { changeNetwork } = useBalanceStore();

    const currentNetworkDefinition = useProfileStore(state => {
        if (!ProfileState.isProfile(state.profileState)) {
            return null;
        }
        return state.profileState.currentNetworkWithDefinition.networkDefinition;
    });

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


    useEffect(() => {
        if (currentNetworkDefinition) {
            console.log("Network changed to", currentNetworkDefinition.chainId);

            const profileState = useProfileStore.getState().profileState;
            if (ProfileState.isProfile(profileState)) {
                changeNetwork(currentNetworkDefinition, profileState.accountsOnCurrentNetwork as Account[]);
            }
        }
    }, [currentNetworkDefinition?.chainId ?? "", changeNetwork]);

    return (
        <AppProviders>
            <Stack>
                <Stack.Protected guard={!isOnboarded}>
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={isOnboarded}>
                    <Stack.Screen name="(home)" options={{ headerShown: false }} />
                    <Stack.Screen name="account/[accountAddress]" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>

            <AccessVaultModal />
            <StatusBar style="auto" />
        </AppProviders>
    );
}
