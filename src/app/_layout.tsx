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
        const { profileState, initialize } = useProfileStore.getState();
        if (!ProfileState.isInitialized(profileState)) {
            initialize().then(() => SplashScreen.hideAsync());
        }
    }, []);

    const currentNetworkDefinition = useProfileStore(state => {
        if (!ProfileState.isProfile(state.profileState)) {
            return null;
        }
        return state.profileState.currentNetworkWithDefinition.networkDefinition;
    });

    useEffect(() => {
        const handleChangeNetwork = async () => {
            const { networkId: rpcStoreNetworkId, changeNetwork: changeRpcNetwork } = useRpcStore.getState();
            if (currentNetworkDefinition && rpcStoreNetworkId !== currentNetworkDefinition.chainId) {
                await changeRpcNetwork(currentNetworkDefinition);
            }

            const { networkId: balanceStoreNetworkId, changeNetwork: changeBalanceNetwork, subscribeToBalanceUpdates, requestRefresh } = useBalanceStore.getState();
            if (currentNetworkDefinition && balanceStoreNetworkId !== currentNetworkDefinition.chainId) {
                await changeBalanceNetwork(currentNetworkDefinition.chainId, useRpcStore.getState().provider);
            }

            const { profileState } = useProfileStore.getState();
            if (ProfileState.isProfile(profileState)) {
                const accounts = profileState.accountsOnCurrentNetwork as Account[];
                await requestRefresh(accounts, accounts);
                await subscribeToBalanceUpdates(accounts);
            }
        }

        handleChangeNetwork();

        return () => {
            const { unsubscribeFromBalanceUpdates } = useBalanceStore.getState()
            unsubscribeFromBalanceUpdates();
        };
    }, [currentNetworkDefinition?.chainId]);

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
