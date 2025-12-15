import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { showToastError } from "@/components/ui/toast";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { fontStyles, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useSwapStore } from "@/stores/swapStore";
import { Quote } from "@/types/swap";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { validateAddress } from "@/utils/addressValidation";
import { fiatBalanceToFormatted, stringToBigint } from "@/utils/formattedBalance";
import { SwapAmount, SwapToken } from "@/utils/swap";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

type SwapTabProps = {
    account: Account;
};

export function SwapTab({
    account,
}: SwapTabProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { sellTokens, buyTokens, fetchTokens, requestQuote } = useSwapStore();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const [focusedField, setFocusedField] = useState<"sell" | "buy" | null>(null);

    const [sellAmount, setSellAmount] = useState<SwapAmount | null>(null);
    const [sellToken, setSellToken] = useState<SwapToken | null>(null);
    const [sellAmountText, setSellAmountText] = useState<string>("");
    const [sellHint, setSellHint] = useState<{ startHint: string, endHint: string } | undefined>(undefined);
    const [sellError, setSellError] = useState<string | undefined>(undefined);
    const [sellLoading, setSellLoading] = useState(false);

    const [buyAmount, setBuyAmount] = useState<SwapAmount | null>(null);
    const [buyToken, setBuyToken] = useState<SwapToken | null>(null);
    const [buyAmountText, setBuyAmountText] = useState<string>("");
    const [buyHint, setBuyHint] = useState<string | undefined>(undefined);
    const [buyLoading, setBuyLoading] = useState(false);

    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [recipientError, setRecipientError] = useState<string | undefined>(undefined);

    const quoteDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const currentQuoteRef = useRef<{ type: "sell" | "buy", quote: Quote } | null>(null);

    const publicBalances: PublicTokenBalance[] | null = useBalanceStore(state => {
        const balances = state.publicBalances.get(account.address) ?? null;
        if (!balances) {
            return null;
        }

        return balances;
    });

    // Fetch available tokens
    useEffect(() => {
        fetchTokens();
    }, []);

    // Request quote with 500ms debounce
    useEffect(() => {
        if (recipientError || recipientAddress.trim() === '') {
            setBuyLoading(false);
            setSellLoading(false);
            return;
        }

        // Determine if we should request a quote
        const shouldRequestSellQuote = focusedField === 'sell' && sellAmount && buyToken;
        const shouldRequestBuyQuote = focusedField === 'buy' && buyAmount && sellToken;

        if (!shouldRequestSellQuote && !shouldRequestBuyQuote) {
            return;
        }

        // Clear any existing timeout
        if (quoteDebounceRef.current) {
            clearTimeout(quoteDebounceRef.current);
            quoteDebounceRef.current = null;
        }

        // Set loading state immediately
        if (shouldRequestSellQuote) {
            setBuyLoading(true);
        } else if (shouldRequestBuyQuote) {
            setSellLoading(true);
        }

        // Debounce the quote request
        quoteDebounceRef.current = setTimeout(async () => {
            try {
                if (shouldRequestSellQuote) {
                    const quote = await requestQuote(
                        'sell',
                        account.address,
                        recipientAddress,
                        sellAmount,
                        buyToken
                    );
                    currentQuoteRef.current = { type: "sell", quote: quote };
                    console.log("Sell quote", quote);

                    setBuyAmountText(quote.amountOutFormatted);
                    setBuyHint(fiatBalanceToFormatted(parseFloat(quote.amountOutUsd)));
                    setSellHint((state) => {
                        return {
                            startHint: fiatBalanceToFormatted(parseFloat(quote.amountInUsd)),
                            endHint: state?.endHint ?? "",
                        };
                    });
                } else if (shouldRequestBuyQuote) {
                    const quote = await requestQuote(
                        'buy',
                        account.address,
                        recipientAddress,
                        buyAmount,
                        sellToken
                    );
                    currentQuoteRef.current = { type: "buy", quote: quote };
                    console.log("Buy quote", quote);

                    setSellAmountText(quote.amountOutFormatted);
                    setSellHint((state) => {
                        return {
                            startHint: fiatBalanceToFormatted(parseFloat(quote.amountOutUsd)),
                            endHint: state?.endHint ?? "",
                        };
                    });
                    setBuyHint(fiatBalanceToFormatted(parseFloat(quote.amountInUsd)));
                }
            } catch (error) {
                showToastError(error);
                currentQuoteRef.current = null;
            } finally {
                setBuyLoading(false);
                setSellLoading(false);
            }
        }, 500);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (quoteDebounceRef.current) {
                clearTimeout(quoteDebounceRef.current);
                quoteDebounceRef.current = null;
            }
        };
    }, [focusedField, sellAmount, buyAmount, sellToken, buyToken, requestQuote, recipientAddress, recipientError]);

    // Check buy available balance
    useEffect(() => {
        if (!sellToken || !publicBalances) {
            return;
        }

        const balance = publicBalances.find(balance => balance.token.contractAddress === sellToken.contractAddress);

        if (!balance) {
            return;
        }

        setSellHint((state) => {
            return {
                startHint: state?.startHint ?? "",
                endHint: `Balance: ${balance.formattedBalance()}`,
            };
        });

        if (!sellAmount) {
            setSellError(undefined);
            return;
        }

        if (sellAmount.amount > balance.spendableBalance) {
            setSellError(t('errors.insufficientBalance'));
        }
    }, [sellAmount, sellToken, publicBalances, setSellHint])

    // Handle buy amount change
    useEffect(() => {
        if (!buyToken) {
            setBuyAmountText("");
            return;
        }

        if (buyAmountText.trim() === '') {
            setBuyAmount(null);
            return;
        }

        if (!isNaN(Number(buyAmountText))) {
            const decimalAmount: bigint = stringToBigint(buyAmountText, buyToken.decimals, '.');

            if (currentQuoteRef.current?.type === "sell" && BigInt(currentQuoteRef.current.quote.amountOut) === decimalAmount) {
                console.log("Quote is up to date");
                return;
            }

            setBuyAmount(new SwapAmount(decimalAmount, buyToken));
        } else {
            setBuyAmount(null);
        }
    }, [buyAmountText, buyToken, setBuyAmount]);

    // Handle sell amount change
    useEffect(() => {
        if (!sellToken) {
            setSellAmountText("");
            return;
        }

        if (sellAmountText.trim() === '') {
            setSellAmount(null);
            return;
        }

        if (!isNaN(Number(sellAmountText))) {
            const decimalAmount: bigint = stringToBigint(sellAmountText, sellToken.decimals, '.');

            if (currentQuoteRef.current?.type === "buy" && BigInt(currentQuoteRef.current.quote.amountOut) === decimalAmount) {
                console.log("Quote is up to date");
                return;
            }

            setSellAmount(new SwapAmount(decimalAmount, sellToken));
        } else {
            setSellAmount(null);
        }
    }, [sellAmountText, sellToken, setSellAmount]);

    useEffect(() => {
        if (!recipientAddress || !buyToken?.blockchain) {
            return;
        }

        if (validateAddress(recipientAddress, buyToken.blockchain)) {
            setRecipientError(undefined);
        } else {
            setRecipientError(t('swap.recipientError', { chain: buyToken.blockchain }));
        }
    }, [recipientAddress, buyToken?.blockchain])

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
        <View style={styles.container}>
            <Text style={styles.description}>
                {t('transactions.swap.description')}
            </Text>

            <TokenAmountInput
                label={t('transactions.swap.sellLabel')}
                placeholder={t('transactions.swap.sellPlaceholder')}
                amount={sellAmountText}
                setAmount={setSellAmountText}
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
                setAmount={setBuyAmountText}
                selectedToken={buyToken}
                setSelectedToken={setBuyToken}
                renderSelectedItem={(token) => <BuyTokenSelectedItem token={token} />}
                renderModalItem={(token) => <BuyTokenModalItem token={token} />}
                tokens={buyTokens}
                loading={buyLoading}
                hintText={buyHint}
                onFocus={(e) => setFocusedField("buy")}
            />

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
        </View>
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
}));

