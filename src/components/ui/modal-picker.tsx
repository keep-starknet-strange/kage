import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import Identifiable from "@/types/Identifiable";
import { ReactNode, useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_ITEMS_FOR_SEARCH = 10;

type ModalPickerProps<T extends Identifiable> = {
    items: T[];
    selectedItem: T | null;
    onSelectItem: (item: T) => void;
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    pickerButtonStyle?: StyleProp<ViewStyle>;
    renderItem: (item: T) => ReactNode;
    renderModalItem: (item: T) => ReactNode;
    matchesSearch?: (item: T, searchQuery: string) => boolean;
};

export function ModalPicker<T extends Identifiable>({
    items,
    selectedItem,
    onSelectItem,
    label,
    placeholder,
    searchPlaceholder = "Search...",
    disabled,
    pickerButtonStyle,
    renderItem,
    renderModalItem = renderItem,
    matchesSearch,
}: ModalPickerProps<T>) {
    const styles = useThemedStyle(themedStyleSheet);
    const insets = useSafeAreaInsets();
    const { colors: colorTokens } = useTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSelectItem = (item: T) => {
        onSelectItem(item);
        setIsModalVisible(false);
        setSearchQuery("");
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSearchQuery("");
    };

    const isSearchAvailable = useMemo(() => {
        return items.length > MIN_ITEMS_FOR_SEARCH;
    }, [items]);

    const filteredItems = !isSearchAvailable || searchQuery.trim() === ""
        ? items
        : items.filter(item => {
            return matchesSearch ? matchesSearch(item, searchQuery) : item.id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });

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
                    name="chevron-down"
                    size={20}
                    color={disabled ? colorTokens['text.muted'] : colorTokens['text.secondary']}
                />
            </Pressable>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                allowSwipeDismissal={true}
                onRequestClose={handleCloseModal}
            >
                <Pressable
                    style={[
                        styles.modalContent,
                        {
                            paddingTop: Platform.select({ android: insets.top }),
                            paddingBottom: insets.bottom
                        }
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{placeholder}</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={handleCloseModal}
                        >
                            <IconSymbol name="close" size={24} color={colorTokens['text.primary']} />
                        </Pressable>
                    </View>

                    {isSearchAvailable && (
                        <View style={styles.searchContainer}>
                            <IconSymbol name="search" size={18} color={colorTokens['text.muted']} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={searchPlaceholder}
                                placeholderTextColor={colorTokens['text.muted']}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery("")}>
                                    <IconSymbol name="close" size={18} color={colorTokens['text.muted']} />
                                </Pressable>
                            )}
                        </View>
                    )}

                    <ScrollView style={styles.itemsList}>
                        {filteredItems.map((item) => (
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colorTokens['bg.sunken'],
        marginHorizontal: spaceTokens[4],
        marginVertical: spaceTokens[3],
        paddingHorizontal: spaceTokens[3],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        gap: spaceTokens[2],
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
        paddingVertical: spaceTokens[2],
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

