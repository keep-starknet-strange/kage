import { ProfileState } from "@/profile/profileState";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { useAccessVaultStore } from "@/stores/accessVaultStore";
import { useProfileStore } from "@/stores/profileStore";
import { AppError } from "@/types/appError";
import { LOG } from "@/utils/logs";
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function BackupScreen() {
    const { insets } = useDynamicSafeAreaInsets();

    const {requestAccess} = useAccessVaultStore();
    const {profileState} = useProfileStore();
    const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
    const [showRetry, setShowRetry] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasMnemonic = useMemo(() => mnemonicWords.length > 0, [mnemonicWords]);
    const keySourceId = useMemo(() => {
        const profile = ProfileState.getProfileOrNull(profileState);
        return profile?.keySources[0]?.id ?? null
    }, [profileState]);

    const fetchMnemonic = useCallback(async () => {
        if (!keySourceId) {
            throw new AppError("Key source ID is not set");
        }

        try {
            setShowRetry(false);
            setShowLoading(true);

            const output = await requestAccess({ requestFor: "seedPhrase", keySourceId });
            
            setMnemonicWords(output.seedPhrase.getWords());
            setShowLoading(false);
        } catch (e) {
            LOG.error("Failed to read mnemonic", e);
            setShowRetry(true);
            setShowLoading(false);
        }
    }, [requestAccess, setMnemonicWords, setShowRetry, setShowLoading, keySourceId]);

    useFocusEffect(
        useCallback(() => {
            void fetchMnemonic();

            return () => {
                setMnemonicWords([]);
            }
        }, [fetchMnemonic, setMnemonicWords])
    );

    const handleCopy = async () => {
        const phrase = mnemonicWords!.join(' ')
        try {
            await Clipboard.setStringAsync(phrase)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch (e) {
            console.warn('Copy to clipboard failed:', e)
        }
    };

    if (showLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
            {hasMnemonic && (
                <View style={styles.block}>
                    <Text style={styles.title}>Backup Your Recovery Phrase</Text>
                    <Text style={styles.hint}>Never share these words with anyone.</Text>

                    <View style={styles.inlineActions}>
                        <Pressable onPress={handleCopy} accessibilityRole="button">
                            <Text style={styles.link}>{copied ? 'Copied!' : 'Copy phrase'}</Text>
                        </Pressable>
                    </View>


                    <View style={styles.wordsGrid}>
                        {mnemonicWords!.map((w, i) => (
                            <View key={`${w}-${i}`} style={styles.wordItem}>
                                <Text style={styles.wordIndex}>{i + 1}.</Text>
                                <Text style={styles.wordText}>{w}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {!hasMnemonic && (
                <View style={styles.block}>
                    <Text style={styles.title}>Could not unlock mnemonic..</Text>
                    <Text style={styles.noMnemonicSub}>Please provide authorization to unlock it.</Text>
                </View>
            )}

            {showRetry && (
                <Button
                    title="Retry"
                    onPress={() => {
                        fetchMnemonic();
                    }}
                />
            )}
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    },
    block: {
        gap: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
    },
    hint: {
        color: '#888',
    },
    inlineActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
    },
    link: {
        color: '#007AFF',
        fontWeight: '500',
    },
    wordsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    wordItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    wordIndex: {
        color: '#666',
        marginRight: 6,
    },
    wordText: {
        fontWeight: '500',
    },
    noMnemonic: {
        fontSize: 16,
        fontWeight: '500',
    },
    noMnemonicSub: {
        color: '#666',
    },
});
