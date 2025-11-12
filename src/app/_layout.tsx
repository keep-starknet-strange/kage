import NetworkBanner from '@/components/ui/network-banner';
import Account, { AccountAddress } from '@/profile/account';
import Profile from '@/profile/profile';
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
import { symmetricDifference } from '@/utils/sets';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        const startSubscriptions = async (profile: Profile) => {
            const { networkId: rpcStoreNetworkId, changeNetwork: changeRpcNetwork } = useRpcStore.getState();
            const currentNetworkDefinition = profile.currentNetworkWithDefinition.networkDefinition;

            if (rpcStoreNetworkId !== currentNetworkDefinition.chainId) {
                await changeRpcNetwork(currentNetworkDefinition);
            }

            const { networkId: balanceStoreNetworkId, changeNetwork: changeBalanceNetwork, requestRefresh, subscribeToBalanceUpdates } = useBalanceStore.getState();
            if (balanceStoreNetworkId !== currentNetworkDefinition.chainId) {
                await changeBalanceNetwork(currentNetworkDefinition.chainId, useRpcStore.getState().provider);
            }

            const accounts = profile.accountsOnCurrentNetwork as Account[];
            await requestRefresh(accounts, accounts);
            setTimeout(async () => {
                await subscribeToBalanceUpdates(accounts);
            }, 1000);
        }
        const { initialize, profileState: profileStateOnMount } = useProfileStore.getState();
        const unsubscribe = useProfileStore.subscribe((state, prevState) => {
            const prevNetworkId = ProfileState.isProfile(prevState.profileState) ? prevState.profileState.currentNetworkWithDefinition.networkDefinition.chainId : null;
            const newNetworkId = ProfileState.isProfile(state.profileState) ? state.profileState.currentNetworkWithDefinition.networkDefinition.chainId : null;

            if (prevNetworkId !== newNetworkId && ProfileState.isProfile(state.profileState)) {
                startSubscriptions(state.profileState);
                return;
            }

            const prevAccounts = ProfileState.isProfile(prevState.profileState) ? new Set(prevState.profileState.accountsOnCurrentNetwork.map((account) => account.id)) : new Set<AccountAddress>();
            const newAccounts = ProfileState.isProfile(state.profileState) ? new Set(state.profileState.accountsOnCurrentNetwork.map((account) => account.id)) : new Set<AccountAddress>();
            
            if (symmetricDifference(newAccounts, prevAccounts).size > 0 && ProfileState.isProfile(state.profileState)) {
                LOG.info("Starting subscriptions for new accounts");
                startSubscriptions(state.profileState);
                return;
            }
        });

        if (!ProfileState.isInitialized(profileStateOnMount)) {
            LOG.info("Initializing profile");
            initialize().then(() => SplashScreen.hideAsync());
        } else if (ProfileState.isProfile(profileStateOnMount)) {
            startSubscriptions(profileStateOnMount);
        }

        return () => {
            unsubscribe();
            void useBalanceStore.getState().unsubscribeFromBalanceUpdates();
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
