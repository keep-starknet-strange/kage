import { useProfileStore } from "@/stores/profileStore";
import { useRouter } from "expo-router";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={{
            flex: 1,
            alignItems: "center"
        }}>
            <Text>WELCOME to KAGE</Text>
            <View style={{ flex: 1 }} />
            <Button
                title="Create new wallet"
                onPress={() => {
                    router.navigate("set-passphrase")
                }}
            />
        </SafeAreaView>
    );
} 