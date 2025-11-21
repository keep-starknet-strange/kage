import { fontStyles, radiusTokens, spaceTokens } from '@/design/tokens';
import { AccountAddress } from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import formattedAddress from '@/utils/formattedAddress';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";

export type AddressViewProps = {
    address: AccountAddress;
    variant?: 'default' | 'compact' | 'full';
}

export function AddressView({ address, variant = 'default' }: AddressViewProps) {
    const [isCopied, setIsCopied] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const displayedAddress = useMemo(() => {
        if (variant === "full") {
            return address;
        } else {
            return formattedAddress(address, variant);
        }
    }, [address, variant]);

    const copyToClipboard = async () => {
        try {
            await Clipboard.setStringAsync(address);
            
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
                                name="checkmark-circle" 
                                size={20} 
                                color={colorTokens['status.success']} 
                            />
                        </View>
                    ) : (
                        <View style={styles.iconContainer}>
                            <IconSymbol 
                                name="copy" 
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
        paddingVertical: spaceTokens[0], 
        paddingHorizontal: spaceTokens[1], 
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        position: 'relative',
    },
    addressContainer: {
        flex: 1,
        marginRight: spaceTokens[1], 
    },
    addressText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
    },
    copyButton: {
        padding: spaceTokens[0], 
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
        paddingHorizontal: spaceTokens[2], 
        paddingVertical: spaceTokens[1], 
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
