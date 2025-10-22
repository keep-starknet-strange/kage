import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Keychain from "react-native-keychain";
import { useFocusEffect } from "expo-router";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const {keyValueStorage} = useAppDependenciesStore();
    const [isResolvingBiometrics, setIsResolvingBiometrics] = useState(false);
    const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);


    
    const resolveBiometricsStatus = useCallback(() => {
        setIsResolvingBiometrics(true);
        Keychain.getSupportedBiometryType()
            .then(async (biometryType) => {
                const isAvailable = biometryType !== null;
                setIsBiometricsAvailable(isAvailable);
                return isAvailable;
            })
            .then((isAvailable) => {
                if (isAvailable) {
                    return keyValueStorage.getOrDefault("device.biometrics.enabled", false);
                }

                return false;
            })
            .then((isEnabled) => {
                setIsBiometricsEnabled(isEnabled);
            });
    }, [setIsResolvingBiometrics, setIsBiometricsAvailable]);


    useFocusEffect(
        useCallback(() => {
            void resolveBiometricsStatus();
        }, [resolveBiometricsStatus])
    );

    const handleBiometricsChange = async (enabled: boolean) => {
        if (!enabled) {
            await keyValueStorage.set("device.biometrics.enabled", false);
        } else {
            
        }
        // setIsResolvingBiometrics(true);
        // const isEnabled = await Keychain.isBiometricsAvailable();
        // setIsBiometricsAvailable(isEnabled);
        // setIsResolvingBiometrics(false);
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Enable Biometrics</Text>

                {!isBiometricsAvailable ? (
                    <Text style={styles.error}>Not available</Text>
                ) : (
                    <Switch
                        value={isBiometricsEnabled}
                        onValueChange={(enabled) => {
                            void handleBiometricsChange(enabled);
                        }}
                        disabled={isResolvingBiometrics}
                    />
                )}

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        fontSize: 17,
    },
    error: {
        fontSize: 14,
        color: 'red',
    }
});