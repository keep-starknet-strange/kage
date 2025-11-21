import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";

export interface ErrorToastProps {
    id: string;
    title: string;
    subtitle: string;
    details: string | null;
    onPress?: () => void;
}

export const ErrorToast = ({ id, title, subtitle, details, onPress }: ErrorToastProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    useEffect(() => {
        setIsExpanded(false);
    }, [id, setIsExpanded]);

    const handlePress = () => {
        if (details) {
            setIsExpanded(!isExpanded);
        }
        onPress?.();
    };

    const handleCopy = async () => {
        if (details) {
            await Clipboard.setStringAsync(details);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <Pressable 
            style={styles.container}
            onPress={handlePress}
        >
            <View style={styles.content}>
                {/* Icon and Main Content */}
                <View style={styles.mainRow}>
                    <View style={styles.iconContainer}>
                        <IconSymbol 
                            name="alert-circle" 
                            size={24} 
                            color={colorTokens['text.inverted']} 
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        <Text style={styles.subtitle} numberOfLines={isExpanded ? undefined : 2}>
                            {subtitle}
                        </Text>
                    </View>

                    {details && (
                        <View style={styles.expandButton}>
                            <IconSymbol 
                                name="chevron-right" 
                                size={16} 
                                color={colorTokens['text.inverted']} 
                                style={[
                                    styles.chevron,
                                    isExpanded && styles.chevronExpanded
                                ]}
                            />
                        </View>
                    )}
                </View>

                {/* Expandable Details Section */}
                {details && isExpanded && (
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailsDivider} />
                        <View style={styles.detailsHeader}>
                            <Text style={styles.detailsLabel}>Details:</Text>
                            <TouchableOpacity 
                                onPress={handleCopy}
                                style={styles.copyButton}
                            >
                                <IconSymbol 
                                    name={isCopied ? "checkmark" : "copy"}
                                    size={14} 
                                    color={colorTokens['text.inverted']} 
                                />
                                <Text style={styles.copyButtonText}>
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.detailsContent}>
                            <Text style={styles.detailsText} selectable>
                                {details}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    content: {
        backgroundColor: colorTokens['status.error'],
        borderRadius: radiusTokens.lg,
        shadowColor: colorTokens['shadow.deep'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spaceTokens[4],
        gap: spaceTokens[3],
    },
    iconContainer: {
        paddingTop: spaceTokens[0],
    },
    textContainer: {
        flex: 1,
        gap: spaceTokens[1],
    },
    title: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.inverted'],
    },
    subtitle: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.inverted'],
        lineHeight: 20,
    },
    expandButton: {
        paddingTop: spaceTokens[0],
        paddingLeft: spaceTokens[2],
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    chevronExpanded: {
        transform: [{ rotate: '90deg' }],
    },
    detailsContainer: {
        paddingHorizontal: spaceTokens[4],
        paddingBottom: spaceTokens[4],
    },
    detailsDivider: {
        height: 1,
        backgroundColor: colorTokens['text.inverted'],
        marginBottom: spaceTokens[3],
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spaceTokens[2],
    },
    detailsLabel: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.inverted'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[1],
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: radiusTokens.sm,
    },
    copyButtonText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.inverted'],
    },
    detailsContent: {
        backgroundColor: colorTokens['bg.sunken'],
        borderRadius: radiusTokens.sm,
        padding: spaceTokens[3],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
    },
    detailsText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 18,
    },
}));

