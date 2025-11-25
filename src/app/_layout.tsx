import NetworkBanner from '@/components/ui/network-banner';
import KageToast, { showToastError } from '@/components/ui/toast';
import Account from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import NetworkDefinition from '@/profile/settings/networkDefinition';
import { AppProviders } from '@/providers/AppProviders';
import { defaultScreenOptions } from '@/providers/ThemeProvider';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import { useOnChainStore } from '@/stores/onChainStore';
import { useProfileStore } from '@/stores/profileStore';
import { useRpcStore } from '@/stores/useRpcStore';
import { LOG } from '@/utils/logs';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from "react";
import { AppState } from 'react-native';
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const appState = useRef(AppState.currentState);
    
    useEffect(() => {
        const { initialize, profileState: profileStateOnMount } = useProfileStore.getState();

        if (!ProfileState.isInitialized(profileStateOnMount)) {
            LOG.info("Initializing profile");
            initialize()
                .then(() => SplashScreen.hideAsync())
                .catch(error => {
                    showToastError(error);
                });
        }

        const appStateSubscription = AppState.addEventListener('change', (state) => {
            if (appState.current === 'background' && state === 'active') {
                const {profileState} = useProfileStore.getState();
                const {subscribeToBalanceUpdates} = useBalanceStore.getState();
                if (ProfileState.isProfile(profileState)) {
                    subscribeToBalanceUpdates(profileState.accountsOnCurrentNetwork as Account[]);
                }
            }

            if (appState.current === 'active' && state === 'background') {
                const {profileState} = useProfileStore.getState();
                const {unsubscribeFromBalanceUpdates} = useBalanceStore.getState();

                if (ProfileState.isProfile(profileState)) {
                    unsubscribeFromBalanceUpdates();
                }
            }

            appState.current = state;
        });

        return () => {
            appStateSubscription.remove();
        }
    }, []);

    const accounts = useProfileStore(state => {
        if (!ProfileState.isProfile(state.profileState)) {
            return null;
        }
        return state.profileState.accountsOnCurrentNetwork as Account[];
    });

    const networkDefinition = useProfileStore(state => {
        if (!ProfileState.isProfile(state.profileState)) {
            return null;
        }
        return state.profileState.currentNetworkDefinition;
    });

    useEffect(() => {
        const setNetworks = async () => {
            const { setNetwork: setRpcNetwork, reset: resetRpc } = useRpcStore.getState();
            const { setNetwork: setBalanceNetwork, reset: resetBalance, unsubscribeFromBalanceUpdates } = useBalanceStore.getState();

            if (networkDefinition === null) {
                await resetBalance();
                await resetRpc();
                return;
            }


            const provider = setRpcNetwork(networkDefinition);
            await setBalanceNetwork(networkDefinition.chainId, provider);
        }

        const checkAccounts = async () => {
            if (accounts === null) {
                return;
            }

            const { checkAccountsDeployed } = useOnChainStore.getState();
            const { requestRefresh, subscribeToBalanceUpdates } = useBalanceStore.getState();

            try {
                await checkAccountsDeployed(accounts);
                await requestRefresh(accounts, accounts);
                await subscribeToBalanceUpdates(accounts);
            } catch (error) {
                showToastError(error);
            }
        }

        setNetworks().then(() => {
            checkAccounts();
        });
    }, [networkDefinition, accounts]);

    const isOnboarded = useProfileStore(state => ProfileState.isOnboarded(state.profileState));
    return (
        <AppProviders>
            <AppStructure isOnboarded={isOnboarded} currentNetworkDefinition={networkDefinition} />
        </AppProviders>
    );
}

function AppStructure({
    isOnboarded,
    currentNetworkDefinition
}: {
    isOnboarded: boolean,
    currentNetworkDefinition: NetworkDefinition | null
}) {
    const screenOptions = defaultScreenOptions();
    return (
        <>
            <Stack
                screenOptions={screenOptions}
            >
                <Stack.Protected guard={!isOnboarded}>
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={isOnboarded}>
                    <Stack.Screen name="(home)" options={{ headerShown: false }} />
                    <Stack.Screen name="account/[accountAddress]" options={{ headerShown: true }} />
                    <Stack.Screen name="account/create" options={{ headerShown: true }} />
                    <Stack.Screen name="tx/[txType]/[accountAddress]" options={{ headerShown: true }} />
                    <Stack.Screen name="keys" options={{ headerShown: true }} />
                    <Stack.Screen name="networks" options={{ headerShown: true }} />
                </Stack.Protected>
            </Stack>

            <AccessVaultModal />
            <NetworkBanner network={currentNetworkDefinition} />
            <KageToast />
            <StatusBar style="light" />
        </>
    );
}

