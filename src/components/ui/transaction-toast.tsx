import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { ProfileState } from "@/profile/profileState";
import { useProfileStore } from "@/stores/profileStore";
import { SerializableTransaction } from "@/types/transaction";
import formattedAddress from "@/utils/formattedAddress";
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "./icon-symbol";

export interface TransactionToastProps {
    transaction: SerializableTransaction;
    pending?: boolean;
    onPress?: () => void;
}

export const TransactionToast = ({ transaction, pending = false, onPress }: TransactionToastProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const currentNetworkDefinition = useProfileStore(state => ProfileState.isProfile(state.profileState) ? state.profileState.currentNetworkWithDefinition.networkDefinition : null);
    
    // Progress bar animation
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (pending) {
            // Animate progress bar from 0 to 1 repeatedly
            Animated.loop(
                Animated.sequence([
                    Animated.timing(progressAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: false,
                    }),
                    Animated.timing(progressAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        } else {
            progressAnim.setValue(0);
        }
    }, [pending, progressAnim]);

    const handlePress = () => {
        setIsExpanded(!isExpanded);
        onPress?.();
    };

    const handleCopyTxHash = async () => {
        await Clipboard.setStringAsync(transaction.txHash);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenExplorer = async () => {
        let explorerUrl = currentNetworkDefinition?.txUrl(transaction.txHash) ?? null;
        if (explorerUrl) {
            await WebBrowser.openBrowserAsync(explorerUrl.toString())
            return;
        }
    };

    const getTitle = () => {
        switch (transaction.type) {
            case "fund":
                return "Funding Transaction";
            case "transfer":
                return "Private Transfer";
            case "withdraw":
                return "Withdrawal";
            case "publicTransfer":
                return "Public Transfer";
            case "deployAccount":
                return "Deploy Transaction";
        }
    };

    const getSubtitle = () => {
        switch (transaction.type) {
            case "fund":
                return `Funded ${transaction.amountFormatted}`;
            case "transfer":
                return `Transferred ${transaction.amountFormatted}`;
            case "withdraw":
                return `Withdrew ${transaction.amountFormatted}`;
            case "publicTransfer":
                return `Sent ${transaction.amountFormatted}`;
            case "deployAccount":
                return pending ? `Account "${transaction.account.name}" deploying on Starknet` : `Account "${transaction.account.name}" deployed on Starknet`;
        }
    };

    const getDetails = () => {
        const details: { label: string; value: string }[] = [];

        switch (transaction.type) {
            case "fund":
                details.push(
                    { label: "From", value: transaction.from.name },
                    { label: "Amount", value: transaction.amountFormatted },
                    { label: "Signer", value: transaction.signer.name }
                );
                break;
            case "transfer":
                details.push(
                    { label: "From", value: transaction.from.name },
                    { label: "To", value: formattedAddress(transaction.recipient.privateTokenAddress.base58, 'compact') },
                    { label: "Amount", value: transaction.amountFormatted },
                    { label: "Signer", value: transaction.signer.name }
                );
                break;
            case "withdraw":
                details.push(
                    { label: "To", value: transaction.to.name },
                    { label: "Amount", value: transaction.amountFormatted },
                    { label: "Signer", value: transaction.signer.name }
                );
                break;
            case "publicTransfer":
                details.push(
                    { label: "From", value: transaction.from.name },
                    { label: "To", value: formattedAddress(transaction.recipient, 'compact') },
                    { label: "Amount", value: transaction.amountFormatted }
                );
                break;
        }

        return details;
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Pressable
            style={styles.container}
            onPress={handlePress}
        >
            <View style={[styles.content, pending && styles.pendingContent]}>
                {/* Icon and Main Content */}
                <View style={styles.mainRow}>
                    <View style={styles.iconContainer}>
                        <IconSymbol
                            name={pending ? "paperplane" : "checkmark.circle.fill"}
                            size={24}
                            color={colorTokens['text.inverted']}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {getTitle()}
                        </Text>
                        <Text style={styles.subtitle} numberOfLines={isExpanded ? undefined : 1}>
                            {getSubtitle()}
                        </Text>
                    </View>

                    <View style={styles.expandButton}>
                        <IconSymbol
                            name="chevron.right"
                            size={16}
                            color={colorTokens['text.inverted']}
                            style={[
                                styles.chevron,
                                isExpanded && styles.chevronExpanded
                            ]}
                        />
                    </View>
                </View>

                {/* Progress Bar */}
                {pending && (
                    <View style={styles.progressBarContainer}>
                        <Animated.View 
                            style={[
                                styles.progressBar,
                                { width: progressWidth }
                            ]} 
                        />
                    </View>
                )}

                {/* Expandable Details Section */}
                {isExpanded && (
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailsDivider} />

                        {/* Transaction Details */}
                        <View style={styles.detailsSection}>
                            {getDetails().map((detail, index) => (
                                <View key={index} style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{detail.label}:</Text>
                                    <Text style={styles.detailValue}>{detail.value}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Transaction Hash */}
                        <View style={styles.txHashSection}>
                            <View style={styles.txHashHeader}>
                                <Text style={styles.txHashLabel}>Transaction Hash:</Text>
                                <View style={styles.txHashActions}>
                                    <TouchableOpacity
                                        onPress={handleCopyTxHash}
                                        style={styles.actionButton}
                                    >
                                        <IconSymbol
                                            name={isCopied ? "checkmark" : "document.on.document"}
                                            size={14}
                                            color={colorTokens['text.inverted']}
                                        />
                                        <Text style={styles.actionButtonText}>
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </Text>
                                    </TouchableOpacity>

                                    {currentNetworkDefinition?.blockExplorerUrl && (
                                        <TouchableOpacity
                                            onPress={handleOpenExplorer}
                                            style={styles.actionButton}
                                        >
                                            <IconSymbol
                                                name="arrow.up.right.square"
                                                size={14}
                                                color={colorTokens['text.inverted']}
                                            />
                                            <Text style={styles.actionButtonText}>
                                                View
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <View style={styles.txHashContent}>
                                <Text style={styles.txHashText} selectable>
                                    {transaction.txHash}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    content: {
        backgroundColor: colorTokens['status.success'],
        borderRadius: radiusTokens.lg,
        shadowColor: colorTokens['shadow.deep'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    pendingContent: {
        backgroundColor: colorTokens['status.info'],
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: '80%',
        alignSelf: 'center',
        marginBottom: spaceTokens[1],
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
        fontWeight: '800',
        color: colorTokens['text.inverted'],
    },
    subtitle: {
        fontSize: 14,
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
        opacity: 0.3,
    },
    detailsSection: {
        gap: spaceTokens[2],
        marginBottom: spaceTokens[3],
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colorTokens['text.inverted'],
        opacity: 0.8,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colorTokens['text.inverted'],
        flex: 1,
        textAlign: 'right',
    },
    txHashSection: {
        gap: spaceTokens[2],
    },
    txHashHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txHashLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colorTokens['text.inverted'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    txHashActions: {
        flexDirection: 'row',
        gap: spaceTokens[2],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[1],
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: radiusTokens.sm,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colorTokens['text.inverted'],
    },
    txHashContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: radiusTokens.sm,
        padding: spaceTokens[3],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    txHashText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: colorTokens['text.inverted'],
        lineHeight: 16,
    },
});

