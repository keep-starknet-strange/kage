import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { colorTokens, spaceTokens } from "@/design/tokens";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from 'expo-image';
import { useAssets } from "expo-asset";

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo and Branding Section */}
                <View style={styles.brandingContainer}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require("res/logo/kage-outline.png")}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.appName}>KAGE</Text>
                        <View style={styles.taglineContainer}>
                            <Text style={styles.tagline}>Privacy is</Text>
                            <Image
                                source={require("res/logo/starknet.png")}
                                style={styles.starknetLogo}
                                contentFit="contain"
                            />
                            <Text style={styles.tagline}>Normal</Text>
                        </View>
                    </View>
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

                {/* Footnote */}
                <View style={styles.footnoteContainer}>
                    <Text style={styles.footnote}>
                        Brought to you by the Starkware Exploration team
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
        paddingHorizontal: spaceTokens[5],
        paddingBottom: spaceTokens[6],
    },
    brandingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: spaceTokens[8],
        gap: spaceTokens[6],
    },
    logoWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 160,
        height: 160,
    },
    starknetLogo: {
        width: 20,
        height: 20,
    },
    textContainer: {
        alignItems: "center",
        gap: spaceTokens[2],
    },
    appName: {
        fontSize: 48,
        fontWeight: "800",
        color: colorTokens['text.primary'],
        letterSpacing: 2,
        textAlign: "center",
    },
    taglineContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: spaceTokens[1],
    },
    tagline: {
        fontSize: 18,
        fontWeight: "500",
        color: colorTokens['text.secondary'],
        textAlign: "center",
    },
    buttonsContainer: {
        gap: spaceTokens[3],
    },
    footnoteContainer: {
        paddingTop: spaceTokens[4],
        paddingBottom: spaceTokens[2],
        alignItems: "center",
    },
    footnote: {
        fontSize: 12,
        color: colorTokens['text.muted'],
        textAlign: "center",
        fontWeight: "400",
    },
}); 