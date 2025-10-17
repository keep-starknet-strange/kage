import {Stack} from 'expo-router';
import 'react-native-reanimated';
import {StatusBar} from 'expo-status-bar';
import {useAccountStore} from "@/stores/useAccountStore";
import {ActivityIndicator, useColorScheme, View} from "react-native";
import React, {useEffect} from "react";
import {DarkTheme, DefaultTheme, ThemeProvider} from "@react-navigation/native";

export default function RootLayout() {
    const {isInitialized, initialize, starknetAccount} = useAccountStore();
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (!isInitialized) {
            void initialize()
        }
    }, [isInitialized, initialize]);

    if (!isInitialized) {
        return (
            <View style={{flex: 1, width: "100%", height: "100%", justifyContent: "center"}}>
                <ActivityIndicator size={"large"}/>
            </View>
        );
    } else {
        return (
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Protected guard={starknetAccount === null}>
                        <Stack.Screen name="welcome" options={{headerShown: false}}/>
                    </Stack.Protected>

                    <Stack.Protected guard={starknetAccount !== null}>
                        <Stack.Screen name="(wallet)" options={{headerShown: false}}/>
                    </Stack.Protected>
                </Stack>

                <StatusBar style="auto" />
            </ThemeProvider>
        );
    }
}
