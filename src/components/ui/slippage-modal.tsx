import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "./primary-button";

// Slippage preset values in 1/100th of a percent (e.g., 100 = 1%)
const SLIPPAGE_PRESETS = [10, 25, 50, 100, 300];
export const DEFAULT_SLIPPAGE = SLIPPAGE_PRESETS[0];

type SlippageModalProps = {
    visible: boolean;
    initialSlippage: number;
    onSlippageConfirm: (value: number) => void;
};

export function SlippageModal({
    visible,
    initialSlippage,
    onSlippageConfirm,
}: SlippageModalProps) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const insets = useSafeAreaInsets();

    const [isCustomSlippage, setIsCustomSlippage] = useState(!SLIPPAGE_PRESETS.includes(initialSlippage));
    const [slippage, setSlippage] = useState(initialSlippage);


    const onClose = () => {
        onSlippageConfirm(slippage);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View
                style={[
                    styles.modalContent,
                    {
                        paddingTop: Platform.select({ android: insets.top }),
                        paddingBottom: insets.bottom + spaceTokens[4]
                    }
                ]}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Slippage Tolerance</Text>
                    <Pressable
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <IconSymbol name="close" size={24} color={colorTokens['text.primary']} />
                    </Pressable>
                </View>

                <View style={styles.slippageContent}>
                    <Text style={styles.slippageDescription}>
                        Your transaction will revert if the price changes unfavorably by more than this percentage.
                    </Text>

                    <View style={styles.slippagePresets}>
                        {SLIPPAGE_PRESETS.map((preset) => (
                            <Pressable
                                key={preset}
                                style={[
                                    styles.slippagePresetButton,
                                    !isCustomSlippage && slippage === preset && styles.slippagePresetButtonSelected
                                ]}
                                onPress={() => {
                                    setSlippage(preset);
                                    setIsCustomSlippage(false);
                                }}
                            >
                                <Text style={[
                                    styles.slippagePresetText,
                                    !isCustomSlippage && slippage === preset && styles.slippagePresetTextSelected
                                ]}>
                                    {(preset / 100).toFixed(preset % 100 === 0 ? 0 : 2)}%
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable
                        style={[
                            styles.customSlippageContainer,
                            isCustomSlippage && styles.customSlippageContainerSelected
                        ]}
                        onPress={() => setIsCustomSlippage(true)}
                    >
                        <Text style={[
                            styles.customSlippageLabel,
                            isCustomSlippage && styles.customSlippageLabelSelected
                        ]}>
                            Custom
                        </Text>
                        <Text style={[
                            styles.customSlippageValue,
                            isCustomSlippage && styles.customSlippageValueSelected
                        ]}>
                            {(slippage / 100).toFixed(2)}%
                        </Text>
                    </Pressable>

                    {isCustomSlippage && (
                        <View style={styles.sliderContainer}>
                            <View style={styles.sliderLabels}>
                                <Text style={styles.sliderLabel}>0.01%</Text>
                                <Text style={styles.sliderLabel}>99%</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={9900}
                                step={1}
                                value={slippage}
                                onValueChange={(value) => setSlippage(Math.round(value))}
                                minimumTrackTintColor={colorTokens['brand.accent']}
                                maximumTrackTintColor={colorTokens['bg.sunken']}
                                thumbTintColor={colorTokens['brand.accent']}
                            />
                        </View>
                    )}
                </View>

                <View style={{ flex: 1 }} />

                <PrimaryButton
                    title="Confirm"
                    onPress={onClose}
                    style={styles.confirmButton}
                />
            </View>
        </Modal>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    modalContent: {
        flex: 1,
        backgroundColor: colorTokens['bg.elevated'],
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
        ...fontStyles.ubuntuMono.bold,
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
    slippageContent: {
        padding: spaceTokens[4],
        gap: spaceTokens[4],
    },
    slippageDescription: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
    slippagePresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spaceTokens[2],
    },
    slippagePresetButton: {
        backgroundColor: colorTokens['bg.sunken'],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[2],
    },
    slippagePresetButtonSelected: {
        backgroundColor: colorTokens['surface.overlay'],
        borderColor: colorTokens['brand.accent'],
    },
    slippagePresetText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
    },
    slippagePresetTextSelected: {
        color: colorTokens['brand.accent'],
    },
    customSlippageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorTokens['bg.sunken'],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[3],
    },
    customSlippageContainerSelected: {
        backgroundColor: colorTokens['surface.overlay'],
        borderColor: colorTokens['brand.accent'],
    },
    customSlippageLabel: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
    },
    customSlippageLabelSelected: {
        color: colorTokens['brand.accent'],
    },
    customSlippageValue: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.muted'],
    },
    customSlippageValueSelected: {
        color: colorTokens['brand.accent'],
    },
    sliderContainer: {
        gap: spaceTokens[1],
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spaceTokens[1],
    },
    sliderLabel: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
    slider: {
        width: '100%',
        height: 40,
    },
    confirmButton: {
        marginHorizontal: spaceTokens[4],
    },
}));

