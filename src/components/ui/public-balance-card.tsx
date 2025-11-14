import { radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { getAggregatedFiatBalance } from "@/types/tokenBalance";
import { fiatBalanceToFormatted } from "@/utils/formattedBalance";
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";
import { AddressView } from "../address-view";
import ActionButton from "./action-buttons";
import { IconSymbol } from "./icon-symbol";

export interface PublicBalanceCardProps {
    account: Account;
    style?: StyleProp<ViewStyle>;
    onTransferPress: () => void;
}

const FundModal = (
    { account, isVisible, onRequestClose }: { account: Account, isVisible: boolean, onRequestClose: () => void }
) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            allowSwipeDismissal={true}
            onRequestClose={onRequestClose}
        >
            <Pressable
                style={styles.modalContent}
                onPress={(e) => e.stopPropagation()}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{"Fund Account"}</Text>
                    <Pressable
                        style={styles.closeButton}
                        onPress={onRequestClose}
                    >
                        <IconSymbol name="xmark" size={24} color={colorTokens['text.primary']} />
                    </Pressable>
                </View>

                <ScrollView style={styles.itemsList}>
                    {account.networkId === "SN_SEPOLIA" && (
                        <Pressable
                            style={styles.item}
                            onPress={() => {
                                const openFaucet = async () => {
                                    const url = "https://starknet-faucet.vercel.app/";
                                    await Clipboard.setStringAsync(account.address);
                                    await WebBrowser.openBrowserAsync(url)
                                    onRequestClose()
                                }

                                openFaucet();
                            }}
                        >
                            <Text style={styles.itemTitle}>{"From Faucet"}</Text>
                            <IconSymbol name="arrow.up.right.square" size={18} color={colorTokens['text.secondary']} />
                        </Pressable>
                    )}

                    <Pressable
                        style={styles.item}
                        onPress={() => { }}
                    >
                        <View style={styles.itemContent}>
                            <Text style={styles.itemTitle}>{"From another Account"}</Text>
                            <AddressView address={account.address} variant="full" />
                        </View>
                    </Pressable>
                </ScrollView>
            </Pressable>
        </Modal>
    );
}

export const PublicBalanceCard = (props: PublicBalanceCardProps) => {
    const { account, style } = props;
    const { publicBalances } = useBalanceStore()
    const [fiatBalance, setFiatBalance] = useState<string | null>(null);
    const [isFundModalVisible, setIsFundModalVisible] = useState(false);
    const styles = useThemedStyle(themedStyleSheet);

    useEffect(() => {
        const aggregated = getAggregatedFiatBalance([account], publicBalances);
        const formatted = fiatBalanceToFormatted(aggregated)
        setFiatBalance(formatted);
    }, [account, publicBalances, setFiatBalance]);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{"Public Balance"}</Text>
            <View style={styles.amountRow}>
                <Text style={styles.amount}>
                    {fiatBalance}
                </Text>
            </View>

            <View style={styles.actionsContainer}>
                <ActionButton
                    icon="plus.circle.fill"
                    label="Fund"
                    onPress={() => {
                        setIsFundModalVisible(true);
                    }}
                    disabled={false}
                />
                <ActionButton
                    icon="arrow.right.circle.fill"
                    label="Send"
                    onPress={() => {
                        props.onTransferPress();
                    }}
                    disabled={false}
                />
            </View>

            <FundModal account={account} isVisible={isFundModalVisible} onRequestClose={() => setIsFundModalVisible(false)} />
        </View>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        padding: spaceTokens[5],
        alignItems: 'center',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 1,
        shadowRadius: spaceTokens[0],
        elevation: 2,
    },
    label: {
        fontSize: 14,
        color: colorTokens['text.muted'],
        marginBottom: spaceTokens[1],
        fontWeight: '500',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    amount: {
        fontSize: 48,
        fontWeight: '700',
        color: colorTokens['text.primary'],
        letterSpacing: -0.5,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[4],
        marginTop: spaceTokens[2],
    },
    modalContent: {
        flex: 1,
        backgroundColor: colorTokens['bg.elevated'],
        borderTopLeftRadius: radiusTokens.lg,
        borderTopRightRadius: radiusTokens.lg,
        maxHeight: '80%',
        paddingBottom: spaceTokens[6],
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spaceTokens[6],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colorTokens['text.primary'],
    },
    closeButton: {
        position: 'absolute',
        left: spaceTokens[4],
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radiusTokens.md,
    },
    itemsList: {
        flex: 1,
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spaceTokens[4],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
    },
    itemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: colorTokens['text.primary'],
    },
    itemContent: {
        flex: 1,
        gap: spaceTokens[2],
    },
}));
