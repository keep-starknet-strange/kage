import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import Identifiable from "@/types/Identifiable";
import { TokenContract } from "@/types/token";
import { stringToBigint } from "@/utils/formattedBalance";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View, FocusEvent } from "react-native";
import { ModalPicker } from "./modal-picker";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder'
import { LinearGradient } from 'expo-linear-gradient';

type TokenAmountInputProps<T extends TokenContract & Identifiable> = {
    label?: string;
    amount: string;
    setAmount: (text: string) => void;
    selectedToken: T | null;
    setSelectedToken: (token: T | null) => void;
    placeholder?: string;
    disabled?: boolean;
    hintText?: string | { startHint: string, endHint: string };
    errorText?: string;
    tokens: T[];
    loading?: boolean;
    renderSelectedItem?: (token: T) => React.ReactNode;
    renderModalItem?: (token: T) => React.ReactNode;
    renderHint?: (hint: string) => React.ReactNode;
    onFocus?: (e: FocusEvent) => void;
};

export function TokenAmountInput<T extends TokenContract & Identifiable>({
    label,
    amount,
    setAmount,
    selectedToken,
    setSelectedToken,
    placeholder,
    disabled = false,
    hintText,
    errorText,
    tokens,
    loading,
    renderSelectedItem,
    renderModalItem,
    renderHint,
    onFocus,
}: TokenAmountInputProps<T>) {
    const { t } = useTranslation();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const finalLabel = label || t('forms.amount.label');
    const finalPlaceholder = placeholder || t('forms.amount.placeholder');

    const renderItem = renderSelectedItem ?? ((token: T) => {
        return (
            <Text style={styles.tokenText}>
                {token.symbol}
            </Text>
        );
    });

    const modalItem = renderModalItem ?? ((token: T) => {
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
                    <Text style={styles.tokenName}>
                        {token.name || token.symbol}
                    </Text>
                </View>
                <Text style={styles.tokenSymbol}>
                    {token.symbol}
                </Text>
            </View>
        );
    });

    const ShimerringPlaceholder = createShimmerPlaceholder(LinearGradient);
    const placeholderVisible = loading ?? false;

    const renderHintView = (hintText: string | { startHint: string, endHint: string }) => {
        let startHint: string = ""
        let endHint: string | null = null;
        if (typeof hintText === "string") {
            startHint = hintText;
            endHint = null;
        } else {
            startHint = hintText.startHint;
            endHint = hintText.endHint;
        }

        return <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{startHint}</Text>
            <Text style={styles.hintText}>{endHint}</Text>
        </View>
    }

    return (
        <View style={styles.container}>
            {finalLabel && <Text style={styles.label}>{finalLabel}</Text>}
            <View style={[
                styles.inputContainer,
                errorText && styles.inputContainerError,
                disabled && styles.inputContainerDisabled
            ]}>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                    {placeholderVisible && <ShimerringPlaceholder
                        shimmerStyle={styles.shimerring}
                        shimmerColors={[colorTokens['brand.glow'], colorTokens['brand.accentSoft'], colorTokens['brand.glow']]}
                        visible={false}
                    />}

                    <TextInput
                        style={[styles.input, disabled && styles.inputDisabled, { opacity: placeholderVisible ? 0 : 1 }]}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder={finalPlaceholder}
                        keyboardType="numeric"
                        placeholderTextColor={colorTokens['text.muted']}
                        editable={!disabled}
                        onFocus={onFocus}
                    />
                </View>


                <ModalPicker
                    items={tokens}
                    selectedItem={selectedToken}
                    onSelectItem={setSelectedToken}
                    placeholder={t('forms.token.placeholder')}
                    disabled={disabled}
                    renderItem={renderItem}
                    renderModalItem={modalItem}
                    pickerButtonStyle={styles.tokenPickerButton}
                />
            </View>
            {errorText && <Text style={styles.errorText}>{errorText}</Text>}
            {!errorText && hintText && renderHintView(hintText)}
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        gap: spaceTokens[1],
    },
    label: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        paddingHorizontal: spaceTokens[3],
        gap: spaceTokens[1],
    },
    inputContainerError: {
        borderColor: colorTokens['status.error'],
    },
    inputContainerDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        opacity: 0.6,
    },
    shimerring: {
        flex: 1,
        position: 'absolute',
        height: '60%',
        width: '100%',
        borderRadius: radiusTokens.pill,
    },
    input: {
        flex: 1,
        paddingVertical: spaceTokens[3],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
        outlineStyle: 'none'
    },
    inputDisabled: {
        color: colorTokens['text.muted'],
    },
    tokenSymbol: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
        paddingLeft: spaceTokens[2],
    },
    tokenSymbolDisabled: {
        color: colorTokens['text.muted'],
    },
    errorText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['status.error'],
        marginStart: spaceTokens[0],
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[1],
        marginHorizontal: spaceTokens[0],
        justifyContent: 'space-between',
    },
    hintText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
    tokenPickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[0],
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
    tokenLogoPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colorTokens['bg.sunken'],
        alignItems: 'center',
        justifyContent: 'center',
    },
    tokenName: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
        flex: 1,
    },
    tokenText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary']
    }
}));

