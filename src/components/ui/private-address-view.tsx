import { fontStyles, radiusTokens, spaceTokens } from '@/design/tokens';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { PrivateTokenAddress } from '@/types/privateRecipient';
import formattedAddress from '@/utils/formattedAddress';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from './icon-symbol';

export type PrivateAddressViewProps = {
    address: PrivateTokenAddress;
    variant?: 'default' | 'compact';
}

export function PrivateAddressView({ address, variant = 'default' }: PrivateAddressViewProps) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const [isCopied, setIsCopied] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const displayedAddress = useMemo(() => {
        return formattedAddress(address.base58, variant);
    }, [address, variant]);

    const copyToClipboard = async () => {
        try {
            await Clipboard.setStringAsync(address.base58);

            // Animate button press
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Fade in success indicator
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            setIsCopied(true);

            setTimeout(() => {
                // Fade out success indicator
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();

                setIsCopied(false);
            }, 1500);
        } catch (e) {
            console.warn('Copy to clipboard failed:', e);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <IconSymbol
                    name="lock.shield.fill"
                    size={20}
                    color={colorTokens['status.success']}
                />
            </View>

            <View style={styles.addressContainer}>
                <Text style={styles.addressText} numberOfLines={1}>
                    {displayedAddress}
                </Text>
            </View>

            <TouchableOpacity
                activeOpacity={0.7}
                disabled={isCopied}
                onPress={copyToClipboard}
                style={styles.copyButton}
            >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    {isCopied ? (
                        <View style={styles.iconContainer}>
                            <IconSymbol
                                name="checkmark.circle.fill"
                                size={20}
                                color={colorTokens['status.success']}
                            />
                        </View>
                    ) : (
                        <View style={styles.iconContainer}>
                            <IconSymbol
                                name="document.on.document"
                                size={18}
                                color={colorTokens['text.secondary']}
                            />
                        </View>
                    )}
                </Animated.View>
            </TouchableOpacity>

            {isCopied && (
                <Animated.View
                    style={[
                        styles.copiedIndicator,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Text style={styles.copiedText}>Copied!</Text>
                </Animated.View>
            )}
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flexDirection: "row",
        backgroundColor: colorTokens['bg.sunken'],
        alignItems: "center",
        justifyContent: "space-around",
        paddingVertical: spaceTokens[0], // 8px
        paddingHorizontal: spaceTokens[1], // 12px
        gap: spaceTokens[1],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        position: 'relative',
    },
    addressContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: 13,
        color: colorTokens['text.secondary'],
        ...fontStyles.ubuntuMono.semibold,
    },
    copyButton: {
        padding: spaceTokens[0], // 4px
        borderRadius: radiusTokens.xs,
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
    },
    iconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copiedIndicator: {
        position: 'absolute',
        top: -32,
        right: 0,
        backgroundColor: colorTokens['status.success'],
        paddingHorizontal: spaceTokens[2], // 12px
        paddingVertical: spaceTokens[1], // 8px
        borderRadius: radiusTokens.sm,
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    copiedText: {
        color: colorTokens['text.inverted'],
        fontSize: 12,
        ...fontStyles.ubuntuMono.semibold,
    },
}));

