import { AddressView } from "@/components/address-view";
import { fontStyles, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { StyleSheet, Text, View } from "react-native";
import { ModalPicker } from "./modal-picker";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useTranslation } from "react-i18next";

type AccountPickerProps = {
    accounts: Account[];
    selectedAccount: Account | null;
    onSelectAccount: (account: Account) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
};

export function AccountPicker({
    accounts,
    selectedAccount,
    onSelectAccount,
    label,
    placeholder,
    disabled = false,
}: AccountPickerProps) {
    const { t } = useTranslation();
    const styles = useThemedStyle(themedStyleSheet);
    
    const finalLabel = label || t('forms.accountPicker.label');
    const finalPlaceholder = placeholder || t('forms.accountPicker.placeholder');
    
    const renderItem = (account: Account) => {
        return (
            <View style={styles.selectedAccountContent}>
                <Text style={styles.accountName}>{account.name}</Text>
                <AddressView address={account.address} variant="compact" />
            </View>
        );
    };

    return (
        <ModalPicker
            items={accounts}
            selectedItem={selectedAccount}
            onSelectItem={onSelectAccount}
            label={finalLabel}
            placeholder={finalPlaceholder}
            disabled={disabled}
            renderItem={renderItem}
            renderModalItem={renderItem}
        />
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    selectedAccountContent: {
        flex: 1,
        gap: spaceTokens[1],
    },
    accountName: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
}));

