import { useRouter } from "expo-router";
import { View, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "@/design/theme";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../kage-logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Spacer to push buttons to bottom */}
                <View style={{ flex: 1 }} />

                {/* Buttons Section */}
                <View style={styles.buttonsContainer}>
                    <PrimaryButton
                        title="Create new wallet"
                        onPress={() => {
                            router.navigate("set-passphrase");
                        }}
                    />

                    <SecondaryButton
                        title="Restore wallet"
                        onPress={() => {
                            router.navigate("restore");
                        }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: appTheme.spacing[4],
        paddingBottom: appTheme.spacing[6],
    },
    logoContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: appTheme.spacing[8],
    },
    logo: {
        width: 200,
        height: 200,
    },
    buttonsContainer: {
        gap: appTheme.spacing[3],
        paddingBottom: appTheme.spacing[4],
    },
}); 