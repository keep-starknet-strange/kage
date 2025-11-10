import NetworkBanner from '@/components/ui/network-banner';
import Account from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { AppProviders } from '@/providers/AppProviders';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import { useProfileStore } from '@/stores/profileStore';
import { useRpcStore } from '@/stores/useRpcStore';
import { LOG } from '@/utils/logs';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from "react";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        const { changeNetwork, requestRefresh, subscribeToBalanceUpdates, unsubscribeFromBalanceUpdates } = useBalanceStore.getState();
        
        const unsubscribe = useProfileStore.subscribe(
            (state) => state.profileState,
            (currentProfileState, prevProfileState) => {
                if (prevProfileState === "retrieving" && ProfileState.isInitialized(currentProfileState)) {
                    SplashScreen.hide()
                }

                const prevNetworkDefinition = ProfileState.isProfile(prevProfileState) ? prevProfileState.currentNetworkWithDefinition.networkDefinition : null;
                if (ProfileState.isProfile(currentProfileState)) {
                    const { network, networkDefinition: currentNetworkDefinition } = currentProfileState.currentNetworkWithDefinition;

                    if (prevNetworkDefinition?.chainId !== currentNetworkDefinition.chainId) {
                        LOG.info("Network changed to", currentNetworkDefinition.chainId);

                        const provider = useRpcStore.getState().changeNetwork(currentNetworkDefinition);
                        const accounts = network.accounts as Account[];
                        changeNetwork(currentNetworkDefinition.chainId, provider).then(() => {
                            requestRefresh(accounts, accounts);
                            subscribeToBalanceUpdates(accounts);
                        })
                    }
                }
            }
        );

        if (!ProfileState.isInitialized(useProfileStore.getState().profileState)) {
            void useProfileStore.getState().initialize();
        }

        return () => {
            unsubscribe();
            unsubscribeFromBalanceUpdates();
        }
    }, []);

    const currentNetworkDefinition = useProfileStore(state => {
        if (!ProfileState.isProfile(state.profileState)) {
            return null;
        }
        return state.profileState.currentNetworkWithDefinition.networkDefinition;
    });

    const isOnboarded = useProfileStore(state => ProfileState.isOnboarded(state.profileState));

    return (
        <AppProviders>
            <Stack>
                <Stack.Protected guard={!isOnboarded}>
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={isOnboarded}>
                    <Stack.Screen name="(home)" options={{ headerShown: false }} />
                    <Stack.Screen name="account/[accountAddress]" options={{ headerShown: false }} />
                    <Stack.Screen name="tx/[txType]/[accountAddress]" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>

            <AccessVaultModal />
            <NetworkBanner network={currentNetworkDefinition} />
        </AppProviders>
    );
}
