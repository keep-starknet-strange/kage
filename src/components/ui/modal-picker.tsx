import { IconSymbol } from "@/components/ui/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import Identifiable from "@/types/Identifiable";
import { ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";

type ModalPickerProps<T extends Identifiable> = {
    items: T[];
    selectedItem: T | null;
    onSelectItem: (item: T) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    pickerButtonStyle?: StyleProp<ViewStyle>;
    renderItem: (item: T) => ReactNode;
    renderModalItem: (item: T) => ReactNode;
};

export function ModalPicker<T extends Identifiable>({
    items,
    selectedItem,
    onSelectItem,
    label,
    placeholder,
    disabled,
    pickerButtonStyle,
    renderItem,
    renderModalItem = renderItem,
}: ModalPickerProps<T>) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleSelectItem = (item: T) => {
        onSelectItem(item);
        setIsModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <Pressable
                style={[
                    pickerButtonStyle ?? styles.pickerButton,
                    disabled && (pickerButtonStyle ?? styles.pickerButtonDisabled)
                ]}
                onPress={() => !disabled && setIsModalVisible(true)}
                disabled={disabled}
            >
                {selectedItem ? (
                    renderItem(selectedItem)
                ) : (
                    <Text style={styles.placeholder}>{placeholder}</Text>
                )}

                <IconSymbol
                    name="chevron.down"
                    size={20}
                    color={disabled ? colorTokens['text.muted'] : colorTokens['text.secondary']}
                />
            </Pressable>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                allowSwipeDismissal={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <Pressable
                    style={styles.modalContent}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{placeholder}</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setIsModalVisible(false)}
                        >
                            <IconSymbol name="xmark" size={24} color={colorTokens['text.primary']} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.itemsList}>
                        {items.map((item) => (
                            <Pressable
                                key={item.id}
                                style={[
                                    styles.item,
                                    selectedItem?.id === item.id && styles.itemSelected
                                ]}
                                onPress={() => handleSelectItem(item)}
                            >
                                {renderModalItem(item)}

                                {selectedItem?.id === item.id && (
                                    <IconSymbol
                                        name="checkmark"
                                        size={20}
                                        color={colorTokens['brand.accent']}
                                    />
                                )}
                            </Pressable>
                        ))}
                    </ScrollView>
                </Pressable>
            </Modal>
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
    pickerButton: {
        flexDirection: 'row',
        gap: spaceTokens[3],
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        padding: spaceTokens[3],
        minHeight: 56,
    },
    pickerButtonDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        opacity: 0.6,
    },
    placeholder: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
    modalContent: {
        flex: 1,
        backgroundColor: colorTokens['bg.elevated'],
        borderTopLeftRadius: radiusTokens.lg,
        borderTopRightRadius: radiusTokens.lg,
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
    itemsList: {
        flex: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spaceTokens[4],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
        gap: spaceTokens[2],
    },
    itemSelected: {
        backgroundColor: colorTokens['bg.sunken'],
    },
}));

