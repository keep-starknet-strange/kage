import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SetPassphraseScreen() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Set passphrase",
            headerBackButtonDisplayMode: "minimal"
        })
    }, [navigation])

    return (
        <View>
            <Text>Set passphrase</Text>
        </View>
    );
}