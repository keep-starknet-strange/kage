import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { SimpleParticleBackground } from "@/components/ui/simple-particle-background";
import { fontStyles, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { Image } from 'expo-image';
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function WelcomeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { insets } = useDynamicSafeAreaInsets();
    const styles = useThemedStyle(themedStyleSheet);

    return (
        <>
            <SimpleParticleBackground />
            <View style={[styles.content, { paddingTop: insets.top + spaceTokens[3], paddingBottom: insets.bottom + spaceTokens[3] }]}>
                {/* Logo and Branding Section */}
                <View style={styles.brandingContainer}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require("res/logo/kage-outline.png")}
                            style={{
                                width: 160,
                                height: 160,
                            }}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.appName}>{t('common.appName')}</Text>
                        <View style={styles.taglineContainer}>
                            <Text style={styles.tagline}>{t('onboarding.welcome.tagline.privacyIs')}</Text>
                            <Image
                                source={require("res/logo/starknet.png")}
                                style={{
                                    width: 20,
                                    height: 20,
                                }}
                                contentFit="contain"
                            />
                            <Text style={styles.tagline}>{t('onboarding.welcome.tagline.normal')}</Text>
                        </View>
                    </View>
                </View>

                {/* Spacer to push buttons to bottom */}
                <View style={{ flex: 1 }} />

                {/* Buttons Section */}
                <View style={styles.buttonsContainer}>
                    <PrimaryButton
                        title={t('onboarding.welcome.createWallet')}
                        onPress={() => {
                            router.navigate({ pathname: "set-passphrase", params: { mode: "create" } });
                        }}
                    />

                    <SecondaryButton
                        title={t('onboarding.welcome.restoreWallet')}
                        onPress={() => {
                            router.navigate("restore-seed-phrase");
                        }}
                    />
                </View>

                {/* Footnote */}
                <View style={styles.footnoteContainer}>
                    <Text style={styles.footnote}>
                        {t('onboarding.welcome.footer')}
                    </Text>
                </View>
            </View>
        </>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
        paddingHorizontal: spaceTokens[5],
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
    textContainer: {
        alignItems: "center",
        gap: spaceTokens[2],
    },
    appName: {
        fontSize: 48,
        ...fontStyles.ubuntuMono.bold,
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
        ...fontStyles.ubuntuMono.semibold,
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
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        textAlign: "center",
    },
})); 