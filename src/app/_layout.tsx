import { AppProviders } from '@/providers/AppProviders';
import { useAccountStore } from "@/stores/useAccountStore";
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import { Platform } from 'react-native';
import Keychain, { ACCESS_CONTROL, AUTHENTICATION_TYPE } from "react-native-keychain";
import 'react-native-reanimated';
import AccessVaultModal from './access-vault-modal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isInitialized, initialize, starknetAccount } = useAccountStore();

    useEffect(() => {
        const keychainOps = async () => {

            // const genericPasswordServices = await Keychain.getAllGenericPasswordServices();
            // console.log("Generic password services", genericPasswordServices);

            const canImplyAuth = await Keychain.canImplyAuthentication({
                authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS
            });

            // Results iOS
            // - null: when none set
            const securityLevel = await Keychain.getSecurityLevel({
                accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE
            });

            // Results iOS
            // - null: when no biometrics
            const supportedType = await Keychain.getSupportedBiometryType();

            // Results iOS
            // - false: when no passcode
            const isPasscodeAvail = await Keychain.isPasscodeAuthAvailable();

            // Android need at least
            // 1. isPasscodeAuthAvailable() == true
            // 2. any biometry type or null

            // iOS need at least
            // 1. isPasscodeAuthAvailable() == true
            // 2. any biometry type or null

            console.log("====== KEYCHAIN ======")
            console.log("OS:", Platform.OS)
            console.log("Can imply auth:", canImplyAuth)
            console.log("Security level:", securityLevel)
            console.log("Biometry type:", supportedType)
            console.log("Passcode available:", isPasscodeAvail)
            console.log("======================")
        }

        if (!isInitialized) {
            void initialize()
                .then(() => {
                    keychainOps()
                })
        } else {
            console.log("SplashScreen.hide()");
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
