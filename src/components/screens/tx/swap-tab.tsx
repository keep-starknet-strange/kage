import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { DEFAULT_SLIPPAGE, SlippageModal } from "@/components/ui/slippage-modal";
import { showToastError, showToastTransaction } from "@/components/ui/toast";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useSwapStore } from "@/stores/swapStore";
import { AppError } from "@/types/appError";
import { Quote, SwapStatus } from "@/types/swap";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { validateAddress } from "@/utils/addressValidation";
import { fiatBalanceToFormatted, stringToBigint } from "@/utils/formattedBalance";
import i18n from "@/utils/i18n";
import { SwapAmount, SwapToken } from "@/utils/swap";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";

type SwapTabProps = {
    account: Account;
};

type QuoteRequest = {
    type: "sell" | "buy";
    amount: bigint;
    originToken: SwapToken;
    destinationToken: SwapToken;
    slippage: number;
}

export function SwapTab({
    account,
}: SwapTabProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { sellTokens, buyTokens, fetchTokens, requestQuote, performSwap } = useSwapStore();
    
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const [focusedField, setFocusedField] = useState<"sell" | "buy" | null>(null);
    const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
    const [sellBalance, setSellBalance] = useState<PublicTokenBalance | null>(null);
    const quoteDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const [currentQuote, setCurrentQuote] = useState<{ type: "sell" | "buy", quote: Quote } | null>(null);

    const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);
    const [slippageModalVisible, setSlippageModalVisible] = useState(false);

    const [sellToken, setSellToken] = useState<SwapToken | null>(null);
    const [sellAmountText, setSellAmountText] = useState<string>("");
    const [sellHint, setSellHint] = useState<{ startHint: string, endHint: string } | undefined>(undefined);
    const [sellError, setSellError] = useState<string | undefined>(undefined);
    const [sellLoading, setSellLoading] = useState(false);
    
    const [buyToken, setBuyToken] = useState<SwapToken | null>(null);
    const [buyAmountText, setBuyAmountText] = useState<string>("");
    const [buyHint, setBuyHint] = useState<string | undefined>(undefined);
    const [buyLoading, setBuyLoading] = useState(false);

    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [recipientError, setRecipientError] = useState<string | undefined>(undefined);

    const [swapInProgress, setSwapInProgress] = useState(false);

    const publicBalances: PublicTokenBalance[] | null = useBalanceStore(state => {
        const balances = state.publicBalances.get(account.address) ?? null;
        if (!balances) {
            return null;
        }

        return balances;
    });

    const handleSellAmountChange = (amount: string) => {
        console.log("handleSellAmountChange", amount);
        if (!sellToken) {
            return;
        }

        setSellAmountText(amount);

        if (!buyToken) {
            return;
        }

        if (isNaN(Number(amount))) {
            return;
        }

        if (amount.trim() === '') {
            setSellError(undefined);
            return;
        }

        const decimalAmount: bigint = stringToBigint(amount, sellToken.decimals, '.');

        if (focusedField === "sell") {
            setQuoteRequest({ type: "sell", amount: decimalAmount, originToken: sellToken, destinationToken: buyToken, slippage });
        }
    }

    const handleBuyAmountChange = (amount: string) => {
        if (!buyToken) {
            return;
        }

        setBuyAmountText(amount);

        if (!sellToken) {
            return;
        }

        if (isNaN(Number(amount))) {
            return;
        }

        if (focusedField === "buy") {
            const decimalAmount: bigint = stringToBigint(amount, buyToken.decimals, '.');
            setQuoteRequest({ type: "buy", amount: decimalAmount, originToken: buyToken, destinationToken: sellToken, slippage });
        }
    }

    const runQuoteRequest = useCallback(async (quoteRequest: QuoteRequest) => {
        setBuyLoading(quoteRequest.type == "sell");
        setSellLoading(quoteRequest.type == "buy");

        try {
            const amount = new SwapAmount(quoteRequest.amount, quoteRequest.originToken);

            const quote = await requestQuote(
                quoteRequest.type,
                account.address,
                amount,
                quoteRequest.destinationToken,
                quoteRequest.slippage
            );

            setCurrentQuote({ type: quoteRequest.type, quote: quote });
        } catch (error) {
            showToastError(error);
            setCurrentQuote(null);
        } finally {
            setBuyLoading(false);
            setSellLoading(false);
        }
    }, [account])

    const triggerSwap = useCallback(async () => {
        if (!quoteRequest) {
            return;
        }
        if (recipientAddress.trim() === '') {
            return;
        }

        setSwapInProgress(true);
        try {
            const swapAmount = new SwapAmount(quoteRequest.amount, quoteRequest.originToken);
            await performSwap(
                quoteRequest.type, 
                account, 
                recipientAddress, 
                swapAmount, 
                quoteRequest.destinationToken, 
                quoteRequest.slippage
            );

            // TODO close screen
        } catch (error) {
            showToastError(error);
        } finally {
            setSwapInProgress(false);
        }
    }, [account, recipientAddress, quoteRequest, showToastError, setSwapInProgress, performSwap]);

    // Fetch available tokens
    useEffect(() => {
        fetchTokens();
    }, []);

    // Check sell available balance
    useEffect(() => {
        if (!sellToken || !publicBalances) {
            return;
        }

        const balance = publicBalances.find(balance => balance.token.contractAddress === sellToken.contractAddress);

        setSellBalance(balance ?? null);
    }, [sellToken, publicBalances, setSellBalance])

    // Update sell hint based on available balance
    useEffect(() => {
        if (!sellBalance) {
            setSellHint(undefined);
            return;
        }

        setSellHint((state) => {
            return {
                startHint: state?.startHint ?? "",
                endHint: `Balance: ${sellBalance.formattedBalance()}`,
            };
        });
    }, [sellBalance, setSellHint])

    // Validate sell amount
    useEffect(() => {
        if (!sellBalance || !sellToken) {
            setSellError(undefined);
            return;
        }

        if (sellAmountText.trim() === '') {
            setSellError(undefined);
            return;
        }

        if (isNaN(Number(sellAmountText))) {
            setSellError(undefined);
            return;
        }

        const decimalAmount = stringToBigint(sellAmountText, sellToken.decimals, '.');
        if (decimalAmount > sellBalance.spendableBalance) {
            setSellError(t('errors.insufficientBalance'));
        } else {
            setSellError(undefined);
        }
    }, [sellAmountText, sellToken, sellBalance, setSellError])

    // Request quotes with 500ms debounce
    useEffect(() => {
        if (!quoteRequest) {
            return;
        }
        
        // Clear any existing timeout
        if (quoteDebounceRef.current) {
            clearTimeout(quoteDebounceRef.current);
            quoteDebounceRef.current = null;
        }

        quoteDebounceRef.current = setTimeout(async () => {
            await runQuoteRequest(quoteRequest);
        }, 500);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (quoteDebounceRef.current) {
                clearTimeout(quoteDebounceRef.current);
                quoteDebounceRef.current = null;
            }
        };
    }, [quoteRequest, runQuoteRequest])

    // Handle quotes
    useEffect(() => {
        if (!currentQuote) {
            return;
        }

        if (currentQuote.type === "sell") {
            setBuyAmountText(currentQuote.quote.amountOutFormatted);
            setBuyHint(fiatBalanceToFormatted(parseFloat(currentQuote.quote.amountOutUsd)));
            setSellHint((state) => {
                return {
                    startHint: fiatBalanceToFormatted(parseFloat(currentQuote.quote.amountInUsd)),
                    endHint: state?.endHint ?? "",
                };
            });
        } else {
            setSellAmountText(currentQuote.quote.amountOutFormatted);
            setSellHint((state) => {
                return {
                    startHint: fiatBalanceToFormatted(parseFloat(currentQuote.quote.amountOutUsd)),
                    endHint: state?.endHint ?? "",
                };
            });
            setBuyHint(fiatBalanceToFormatted(parseFloat(currentQuote.quote.amountInUsd)));
        }
    }, [currentQuote, setBuyAmountText, setSellAmountText, setBuyHint, setSellHint])

    // Validate recipient address
    useEffect(() => {
        if (!buyToken?.blockchain) {
            return;
        }

        if (recipientAddress.trim() === '') {
            setRecipientError(undefined);
            return;
        }

        if (validateAddress(recipientAddress, buyToken.blockchain)) {
            setRecipientError(undefined);
        } else {
            setRecipientError(t('transactions.swap.recipientError', { chain: buyToken.blockchain }));
        }
    }, [recipientAddress, buyToken?.blockchain, setRecipientError])

    const isSwapPossible = useMemo(() => {
        if (swapInProgress) {
            return false;
        }

        if (!buyToken || !sellToken) {
            return false;
        }

        if (buyLoading || sellLoading) {
            return false;
        }

        if (sellError || recipientError) {
            return false;
        }

        if (recipientAddress.trim() === '') {
            return false;
        }

        if (sellAmountText.trim() === '' || buyAmountText.trim() === '') {
            return false;
        }

        if (isNaN(Number(sellAmountText)) || isNaN(Number(buyAmountText))) {
            return false;
        }
        
        return true;
    }, [sellToken, buyToken, sellError, recipientAddress, recipientError, sellAmountText, buyAmountText, buyLoading, sellLoading, swapInProgress]);


    // If account not found, show error
    if (!publicBalances) {
        return (
            <View style={[styles.container]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('swap.detail.notFound')}</Text>
                    <SecondaryButton
                        title={t('swap.detail.goBackButton')}
                        onPress={() => router.back()}
                    />
                </View>
            </View>
        );
    }

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.description}>
                    {t('transactions.swap.description')}
                </Text>

                <TokenAmountInput
                    label={t('transactions.swap.sellLabel')}
                    placeholder={t('transactions.swap.sellPlaceholder')}
                    amount={sellAmountText}
                    setAmount={handleSellAmountChange}
                    selectedToken={sellToken}
                    setSelectedToken={setSellToken}
                    tokens={sellTokens}
                    hintText={sellHint}
                    errorText={sellError}
                    loading={sellLoading}
                    onFocus={(e) => setFocusedField("sell")}
                />

                <TokenAmountInput
                    label={t('transactions.swap.buyLabel')}
                    placeholder={t('transactions.swap.buyPlaceholder')}
                    amount={buyAmountText}
                    setAmount={handleBuyAmountChange}
                    selectedToken={buyToken}
                    setSelectedToken={setBuyToken}
                    renderSelectedItem={(token) => <BuyTokenSelectedItem token={token} />}
                    renderModalItem={(token) => <BuyTokenModalItem token={token} />}
                    tokens={buyTokens}
                    loading={buyLoading}
                    hintText={buyHint}
                    onFocus={(e) => setFocusedField("buy")}
                />

                <Pressable
                    style={styles.slippageButton}
                    onPress={() => setSlippageModalVisible(true)}
                >
                    <IconSymbol name="settings" size={16} color={colorTokens['text.secondary']} />
                    <Text style={styles.slippageButtonText}>
                        {t('transactions.swap.slippageLabel', { slippage: (slippage / 100).toFixed(slippage % 100 === 0 ? 0 : 2) })}
                    </Text>
                    <IconSymbol name="chevron-right" size={16} color={colorTokens['text.muted']} />
                </Pressable>

                {buyToken && (
                    <View style={styles.recipientContainer}>
                        <Text style={styles.recipientLabel}>{t('transactions.swap.recipientLabel', { chain: buyToken.blockchain })}</Text>
                        <TextInput
                            style={styles.recipientInput}
                            placeholder={t('transactions.swap.recipientPlaceholder', { token: buyToken.symbol, chain: buyToken.blockchain })}
                            placeholderTextColor={colorTokens['text.muted']}
                            value={recipientAddress}
                            onChangeText={setRecipientAddress}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {recipientError && (
                            <Text style={styles.recipientError}>{t('transactions.swap.recipientError', { chain: buyToken.blockchain })}</Text>
                        )}

                        <View style={styles.recipientWarning}>
                            <IconSymbol name="alert-circle" size={16} color={colorTokens['status.warning']} />
                            <Text style={styles.recipientWarningText}>
                                {t('transactions.swap.recipientWarning', { chain: buyToken.blockchain })}
                            </Text>
                        </View>
                    </View>
                )}

                <PrimaryButton
                    title="Swap"
                    disabled={!isSwapPossible}
                    loading={swapInProgress}
                    onPress={triggerSwap}
                />
            </View>

            <SlippageModal
                visible={slippageModalVisible}
                initialSlippage={slippage}
                onSlippageConfirm={(value) => {
                    setSlippage(value)
                    setSlippageModalVisible(false);
                }}
            />
        </>
    );
}

const BuyTokenModalItem = ({ token }: { token: SwapToken }) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const hasLogo = token.logo !== null;

    return (
        <View style={styles.tokenItemContainer}>
            <View style={styles.tokenLeftSection}>
                {hasLogo ? (
                    <Image
                        source={{ uri: token.logo!.toString() }}
                        style={{
                            width: spaceTokens[5],
                            height: spaceTokens[5],
                            borderRadius: 12,
                        }}
                    />
                ) : (
                    <IconSymbol name="currency" size={spaceTokens[5]} color={colorTokens['text.primary']} />
                )}
                <View style={styles.tokenInfoModal}>
                    <Text style={styles.tokenName}>{token.symbol}</Text>
                    <Text style={[styles.tokenVia, { marginLeft: 6 }]}>
                        on {token.blockchain.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.tokenSymbol}>
                {token.symbol}
            </Text>
        </View>
    );
}

const BuyTokenSelectedItem = ({ token }: { token: SwapToken }) => {
    const styles = useThemedStyle(themedStyleSheet);

    return (
        <View style={styles.tokenInfoSelected}>
            <Text style={styles.tokenName}>{token.symbol}</Text>
            <Text style={[styles.tokenVia]}>
                on {token.blockchain.toUpperCase()}
            </Text>
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        flexDirection: 'column',
        gap: spaceTokens[3],
        paddingHorizontal: spaceTokens[3],
    },
    description: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spaceTokens[4],
        gap: spaceTokens[4],
    },
    errorText: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    tokenItemContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    tokenLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
        flex: 1,
    },
    tokenName: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    tokenSymbol: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
        paddingLeft: spaceTokens[2],
    },
    tokenInfoModal: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tokenInfoSelected: {
        flexDirection: 'column',
    },
    tokenVia: {
        fontSize: 10,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
    recipientContainer: {
        marginTop: spaceTokens[5],
        gap: spaceTokens[1],
    },
    recipientLabel: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    recipientInput: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[3],
        paddingVertical: spaceTokens[2],
    },
    recipientError: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['status.error'],
    },
    recipientWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        backgroundColor: colorTokens['surface.overlay'],
        borderRadius: 8,
        padding: spaceTokens[2],
    },
    recipientWarningText: {
        flex: 1,
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['status.warning'],
        lineHeight: 16,
    },
    slippageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[3],
        paddingVertical: spaceTokens[2],
        marginTop: spaceTokens[1],
        gap: spaceTokens[2],
    },
    slippageButtonText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
}));

