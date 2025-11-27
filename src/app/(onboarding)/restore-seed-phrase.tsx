import { PrimaryButton } from "@/components/ui/primary-button";
import { SeedPhraseInput } from "@/components/ui/seed-phrase-input";
import { SimpleHeader } from "@/components/ui/simple-header";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useTempStore } from "@/stores/tempStore";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function RestoreSeedPhraseScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const router = useRouter();
    const { insets } = useDynamicSafeAreaInsets();
    
    const [isFormValid, setIsFormValid] = useState(false);
    const { setTempSeedPhraseWords } = useTempStore();

    const styles = useThemedStyle(themedStyleSheet);

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title={t('onboarding.restoreSeedPhrase.title')}
                    onBackPress={() => router.back()}
                    style={{ paddingTop: insets.top }}
                />
            ),
        });
    }, [navigation, router, t]);
    
    const handleSetSeedPhrase = useCallback(
        (words: SeedPhraseWords | null) => {            
            setIsFormValid(words !== null);
            if (words) {
                setTempSeedPhraseWords(words);
            }
        },
        [setIsFormValid]
    );

    const handleNext = useCallback(
        () => {
            router.navigate({ pathname: "set-passphrase", params: { mode: "restore" } });
        },
        [router]
    );



    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                <Text style={styles.subtitle}>
                    {t('onboarding.restoreSeedPhrase.description')}
                </Text>
            </View>

            <SeedPhraseInput
                style={styles.seedPhraseInput}
                onSeedPhraseChange={handleSetSeedPhrase}
                wordCount={24}
            />

            <PrimaryButton
                style={[styles.buttonSection, { marginBottom: insets.bottom + spaceTokens[3] }]}
                title={t('onboarding.restoreSeedPhrase.button')}
                onPress={handleNext}
                disabled={!isFormValid}
            />
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spaceTokens[4],
        paddingBottom: spaceTokens[4],
    },
    headerSection: {
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[5],
        gap: spaceTokens[2],
    },
    subtitle: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 22,
    },
    section: {
        gap: spaceTokens[3],
        marginBottom: spaceTokens[4],
    },
    sectionTitle: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    label: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    helperText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 18,
    },
    seedPhraseInput: {
        paddingHorizontal: spaceTokens[4],
    },
    inlineActions: {
        flexDirection: 'row',
        gap: spaceTokens[4],
    },
    link: {
        color: colorTokens['brand.accent'],
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    validationText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
    },
    validationSuccess: {
        color: colorTokens['status.success'],
    },
    validationError: {
        color: colorTokens['status.error'],
    },
    inputGroup: {
        gap: spaceTokens[2],
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        borderWidth: 1.5,
        borderColor: colorTokens['border.subtle'],
    },
    input: {
        flex: 1,
        paddingVertical: spaceTokens[4],
        paddingHorizontal: spaceTokens[4],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
    },
    eyeButton: {
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[2],
    },
    eyeButtonText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['brand.accent'],
    },
    buttonSection: {
        marginHorizontal: spaceTokens[3],
    },
}));

