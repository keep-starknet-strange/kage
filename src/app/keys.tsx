import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { SimpleHeader } from "@/components/ui/simple-header";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import KeySource from "@/profile/keys/keySource";
import { ProfileState } from "@/profile/profileState";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useAccessVaultStore } from "@/stores/accessVaultStore";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useProfileStore } from "@/stores/profileStore";
import Token from "@/types/token";
import formattedAddress from "@/utils/formattedAddress";
import { LOG } from "@/utils/logs";
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export default function KeysScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();
    const { profileState } = useProfileStore();
    const { requestAccess } = useAccessVaultStore();
    const { privateBalances, unlockedPrivateBalances } = useBalanceStore();
    const [expandedKeySourceIds, setExpandedKeySourceIds] = useState<Set<string>>(new Set());
    const [viewingSeedPhraseForKeyId, setViewingSeedPhraseForKeyId] = useState<string | null>(null);
    const [seedPhraseWords, setSeedPhraseWords] = useState<string[]>([]);
    const [loadingSeedPhrase, setLoadingSeedPhrase] = useState(false);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const profile = useMemo(() => ProfileState.getProfileOrNull(profileState), [profileState]);

    const keysData = useMemo(() => {
        if (!profile) return [];

        return profile.keySources.map(keySource => {
            const accounts = profile.currentNetwork.accounts.filter(
                account => account.keyInstance.keySourceId === keySource.id
            );

            const accountsWithTokens = accounts.map(account => {
                const balances = privateBalances.get(account.address) || [];
                const isUnlocked = unlockedPrivateBalances.has(account.address);

                const tokens = balances
                    .filter(balance => balance.spendableBalance > 0n)
                    .map(balance => balance.token);

                return {
                    account,
                    tokens,
                    isUnlocked,
                };
            });

            return {
                keySource,
                accounts: accountsWithTokens
            };
        });
    }, [profile, privateBalances, unlockedPrivateBalances]);

    const toggleKeySource = (keySourceId: string) => {
        setExpandedKeySourceIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(keySourceId)) {
                newSet.delete(keySourceId);
            } else {
                newSet.add(keySourceId);
            }
            return newSet;
        });
    };

    const handleViewSeedPhrase = async (keySourceId: string) => {
        if (viewingSeedPhraseForKeyId === keySourceId) {
            // Hide seed phrase
            setViewingSeedPhraseForKeyId(null);
            setSeedPhraseWords([]);
            return;
        }

        try {
            setLoadingSeedPhrase(true);
            const output = await requestAccess(
                { requestFor: "seedPhrase", keySourceId },
                {
                    title: "Accessing Seed Phrase...",
                    subtitleAndroid: `Authorize to access seed phrase`,
                    descriptionAndroid: "KAGE needs your authentication to securely access your seed phrase.",
                    cancelAndroid: "Cancel",
                }
            );
            setSeedPhraseWords(output.seedPhrase.getWords());
            setViewingSeedPhraseForKeyId(keySourceId);
        } catch (error) {
            LOG.error("Failed to read seed phrase", error);
            showToastError(error);
        } finally {
            setLoadingSeedPhrase(false);
        }
    };

    const handleCopySeedPhrase = async (keySourceId: string) => {
        const phrase = seedPhraseWords.join(' ');
        try {
            await Clipboard.setStringAsync(phrase);
            setCopiedKeyId(keySourceId);
            setTimeout(() => setCopiedKeyId(null), 1500);
        } catch (e) {
            LOG.error('Copy to clipboard failed:', e);
            showToastError(e);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title="Key Sources"
                    subtitle="Manage your cryptographic keys and secured assets"
                    onBackPress={() => router.back()}
                />
            ),
        });
    }, [navigation, insets.top, router]);

    if (!profile) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.emptyState}>
                    <IconSymbol name="key-alert" size={48} color={colorTokens['text.muted']} />
                    <Text style={styles.emptyStateText}>No profile found</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: spaceTokens[3] + insets.bottom }]}
        >
            {/* Key Sources List */}
            {keysData.length === 0 ? (
                <View style={styles.emptyState}>
                    <IconSymbol name="key-alert" size={48} color={colorTokens['text.muted']} />
                    <Text style={styles.emptyStateText}>No key sources found</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Create an account to generate your first key source
                    </Text>
                </View>
            ) : (
                <View style={styles.keySourcesList}>
                    {keysData.map(({ keySource, accounts }) => (
                        <KeySourceItem
                            key={keySource.id}
                            keySource={keySource}
                            accounts={accounts}
                            isExpanded={expandedKeySourceIds.has(keySource.id)}
                            onToggle={() => toggleKeySource(keySource.id)}
                            onViewSeedPhrase={() => handleViewSeedPhrase(keySource.id)}
                            isViewingSeedPhrase={viewingSeedPhraseForKeyId === keySource.id}
                            seedPhraseWords={viewingSeedPhraseForKeyId === keySource.id ? seedPhraseWords : []}
                            loadingSeedPhrase={loadingSeedPhrase && viewingSeedPhraseForKeyId === keySource.id}
                            onCopySeedPhrase={() => handleCopySeedPhrase(keySource.id)}
                            isCopied={copiedKeyId === keySource.id}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

interface KeySourceItemProps {
    keySource: KeySource;
    accounts: Array<{
        account: Account;
        tokens: Token[];
        isUnlocked: boolean;
    }>;
    isExpanded: boolean;
    onToggle: () => void;
    onViewSeedPhrase: () => void;
    isViewingSeedPhrase: boolean;
    seedPhraseWords: string[];
    loadingSeedPhrase: boolean;
    onCopySeedPhrase: () => void;
    isCopied: boolean;
}

function KeySourceItem({
    keySource,
    accounts,
    isExpanded,
    onToggle,
    onViewSeedPhrase,
    isViewingSeedPhrase,
    seedPhraseWords,
    loadingSeedPhrase,
    onCopySeedPhrase,
    isCopied
}: KeySourceItemProps) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const rotateValue = useSharedValue(isExpanded ? 180 : 0);

    const animatedStyle = useAnimatedStyle(() => {
        rotateValue.value = withTiming(isExpanded ? 180 : 0, { duration: 200 });
        return {
            transform: [{ rotate: `${rotateValue.value}deg` }]
        };
    });

    const totalAccounts = accounts.length;
    const totalTokens = accounts.reduce((sum, acc) => sum + acc.tokens.length, 0);

    return (
        <View style={styles.keySourceCard}>
            {/* Header - Always visible */}
            <Pressable
                style={styles.keySourceHeader}
                onPress={onToggle}
                android_ripple={{ color: colorTokens['bg.sunken'] }}
            >
                <View style={styles.keySourceHeaderLeft}>
                    <View style={styles.keyIconContainer}>
                        <IconSymbol
                            name="key"
                            size={20}
                            color={colorTokens['brand.accent']}
                        />
                    </View>
                    <View style={styles.keySourceInfo}>
                        <Text style={styles.keySourceTitle}>Key Source</Text>
                        <Text style={styles.keySourceId} numberOfLines={1}>
                            {formattedAddress(keySource.id, 'compact')}
                        </Text>
                        <View style={styles.keySourceStats}>
                            <View style={styles.statBadge}>
                                <IconSymbol
                                    name="person"
                                    size={12}
                                    color={colorTokens['text.secondary']}
                                />
                                <Text style={styles.statText}>{totalAccounts} account{totalAccounts !== 1 ? 's' : ''}</Text>
                            </View>
                            {totalTokens > 0 && (
                                <View style={styles.statBadge}>
                                    <IconSymbol
                                        name="lock-shield"
                                        size={12}
                                        color={colorTokens['text.secondary']}
                                    />
                                    <Text style={styles.statText}>{totalTokens} private token{totalTokens !== 1 ? 's' : ''}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <Animated.View style={animatedStyle}>
                    <IconSymbol
                        name="chevron-down"
                        size={20}
                        color={colorTokens['text.muted']}
                    />
                </Animated.View>
            </Pressable>

            {/* Expandable Content */}
            {isExpanded && (
                <View style={styles.keySourceContent}>
                    {/* View Seed Phrase Button */}
                    <TouchableOpacity
                        style={styles.viewSeedPhraseButton}
                        onPress={onViewSeedPhrase}
                        disabled={loadingSeedPhrase}
                    >
                        <View style={styles.viewSeedPhraseButtonContent}>
                            <IconSymbol
                                name={isViewingSeedPhrase ? "eye-off" : "eye"}
                                size={16}
                                color={colorTokens['brand.accent']}
                            />
                            <Text style={styles.viewSeedPhraseButtonText}>
                                {loadingSeedPhrase ? 'Loading...' : isViewingSeedPhrase ? 'Hide Recovery Phrase' : 'View Recovery Phrase'}
                            </Text>
                        </View>
                        {loadingSeedPhrase && (
                            <ActivityIndicator size="small" color={colorTokens['brand.accent']} />
                        )}
                    </TouchableOpacity>

                    {/* Seed Phrase Display */}
                    {isViewingSeedPhrase && seedPhraseWords.length > 0 && (
                        <View style={styles.seedPhraseContainer}>
                            <View style={styles.seedPhraseHeader}>
                                <Text style={styles.seedPhraseWarning}>⚠️ Never share your recovery phrase</Text>
                                <TouchableOpacity onPress={onCopySeedPhrase}>
                                    <Text style={styles.copyButton}>
                                        {isCopied ? '✓ Copied!' : 'Copy'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.seedPhraseGrid}>
                                {seedPhraseWords.map((word, index) => (
                                    <View key={`${word}-${index}`} style={styles.seedPhraseWord}>
                                        <Text style={styles.seedPhraseWordIndex}>{index + 1}.</Text>
                                        <Text
                                            style={styles.seedPhraseWordText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >{word}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Accounts List */}
                    <View style={styles.accountsSection}>
                        <Text style={styles.accountsSectionTitle}>Accounts</Text>
                        {accounts.length === 0 ? (
                            <View style={styles.emptyAccounts}>
                                <Text style={styles.emptyAccountsText}>No accounts using this key source</Text>
                            </View>
                        ) : (
                            accounts.map(({ account, tokens, isUnlocked }) => (
                                <AccountItem
                                    key={account.id}
                                    account={account}
                                    tokens={tokens}
                                    isUnlocked={isUnlocked}
                                />
                            ))
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

interface AccountItemProps {
    account: any;
    tokens: any[];
    isUnlocked: boolean;
}

function AccountItem({ account, tokens, isUnlocked }: AccountItemProps) {
    const { unlockPrivateBalances } = useBalanceStore();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const handleUnlock = async () => {
        try {
            await unlockPrivateBalances([account]);
        } catch (error) {
            showToastError(error);
        }
    }

    return (
        <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
                <View style={styles.accountIconContainer}>
                    <IconSymbol
                        name="person-circle"
                        size={16}
                        color={colorTokens['brand.accent']}
                    />
                </View>
                <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountAddress}>
                        {formattedAddress(account.address, 'compact')}
                    </Text>
                </View>
                {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                        <IconSymbol
                            name="lock-open"
                            size={12}
                            color={colorTokens['status.success']}
                        />
                        <Text style={styles.unlockedText}>Unlocked</Text>
                    </View>
                )}
            </View>

            {/* Private Tokens */}
            {tokens.length > 0 ? (
                <View style={styles.tokensSection}>
                    <Text style={styles.tokensSectionTitle}>Private Tokens Secured</Text>
                    <View style={styles.tokensList}>
                        {tokens.map((token, index) => (
                            <View key={`${token.id}-${index}`} style={styles.tokenChip}>
                                <IconSymbol
                                    name="lock-shield"
                                    size={12}
                                    color={colorTokens['brand.accent']}
                                />
                                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.noTokens}>
                    {isUnlocked ? (
                        <Text style={styles.noTokensText}>No private tokens with balance</Text>
                    ) : (
                        <TouchableOpacity onPress={handleUnlock}>
                            <View style={styles.lockedTokens}>
                                <IconSymbol
                                    name="lock"
                                    size={14}
                                    color={colorTokens['text.muted']}
                                />
                                <Text style={styles.lockedTokensText}>
                                    Unlock to view private tokens
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    scrollContent: {
        paddingHorizontal: spaceTokens[5],
        paddingVertical: spaceTokens[3],
    },
    keySourcesList: {
        gap: spaceTokens[4],
    },
    keySourceCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    keySourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spaceTokens[4],
    },
    keySourceHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spaceTokens[3],
    },
    keyIconContainer: {
        width: 44,
        height: 44,
        borderRadius: radiusTokens.md,
        backgroundColor: colorTokens['brand.glow'],
        justifyContent: 'center',
        alignItems: 'center',
    },
    keySourceInfo: {
        flex: 1,
        gap: spaceTokens[1],
    },
    keySourceTitle: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.secondary'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    keySourceId: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    keySourceStats: {
        flexDirection: 'row',
        gap: spaceTokens[2],
        marginTop: spaceTokens[1],
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        backgroundColor: colorTokens['bg.default'],
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[1],
        borderRadius: radiusTokens.sm,
    },
    statText: {
        fontSize: 12,
        color: colorTokens['text.secondary'],
        ...fontStyles.ubuntuMono.semibold,
    },
    keySourceContent: {
        borderTopWidth: 1,
        borderTopColor: colorTokens['border.subtle'],
        padding: spaceTokens[4],
        gap: spaceTokens[3],
    },
    viewSeedPhraseButton: {
        backgroundColor: colorTokens['brand.glow'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[3],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colorTokens['brand.accent'] + '20',
    },
    viewSeedPhraseButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    viewSeedPhraseButtonText: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['brand.accent'],
    },
    seedPhraseContainer: {
        backgroundColor: colorTokens['bg.default'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        gap: spaceTokens[3],
        borderWidth: 1,
        borderColor: colorTokens['status.warning'] + '40',
    },
    seedPhraseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: spaceTokens[2],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
    },
    seedPhraseWarning: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['status.warning'],
        flex: 1,
    },
    copyButton: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['brand.accent'],
    },
    seedPhraseGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spaceTokens[2],
    },
    seedPhraseWord: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[2],
        width: '30%',
    },
    seedPhraseWordIndex: {
        fontSize: 12,
        color: colorTokens['text.muted'],
        marginRight: spaceTokens[0],
        ...fontStyles.ubuntuMono.semibold,
    },
    seedPhraseWordText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    accountsSection: {
        gap: spaceTokens[3],
    },
    accountsSectionTitle: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.muted'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyAccounts: {
        padding: spaceTokens[4],
        alignItems: 'center',
    },
    emptyAccountsText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.italic,
        color: colorTokens['text.muted'],
    },
    accountCard: {
        backgroundColor: colorTokens['bg.default'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[3],
        gap: spaceTokens[3],
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    accountIconContainer: {
        width: 32,
        height: 32,
        borderRadius: radiusTokens.sm,
        backgroundColor: colorTokens['brand.glow'],
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountInfo: {
        flex: 1,
        gap: 4,
    },
    accountName: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    accountAddress: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
    unlockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        backgroundColor: 'rgba(47, 185, 132, 0.1)',
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[1],
        borderRadius: radiusTokens.sm,
    },
    unlockedText: {
        fontSize: 11,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['status.success'],
    },
    tokensSection: {
        gap: spaceTokens[2],
    },
    tokensSectionTitle: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.muted'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tokensList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spaceTokens[2],
    },
    tokenChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        backgroundColor: colorTokens['brand.glow'],
        paddingHorizontal: spaceTokens[2],
        paddingVertical: 10,
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['brand.accent'] + '20',
    },
    tokenSymbol: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['brand.accent'],
    },
    noTokens: {
        paddingVertical: spaceTokens[2],
    },
    noTokensText: {
        fontSize: 13,
        color: colorTokens['text.muted'],
        ...fontStyles.ubuntuMono.italic,
        textAlign: 'center',
    },
    lockedTokens: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spaceTokens[2],
        padding: spaceTokens[2],
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
    },
    lockedTokensText: {
        fontSize: 13,
        color: colorTokens['text.muted'],
        ...fontStyles.ubuntuMono.italic,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[8],
        gap: spaceTokens[3],
    },
    emptyStateText: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
    },
    emptyStateSubtext: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        textAlign: 'center',
        paddingHorizontal: spaceTokens[6],
    },
}));

