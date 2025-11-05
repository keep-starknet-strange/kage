import { AddressView } from "@/components/address-view";
import { colorTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { StyleSheet, Text, View } from "react-native";
import { ModalPicker } from "./modal-picker";

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
    label = "Select Account",
    placeholder = "Choose an account",
    disabled = false,
}: AccountPickerProps) {
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
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            renderItem={renderItem}
        />
    );
}

const styles = StyleSheet.create({
    selectedAccountContent: {
        flex: 1,
        gap: spaceTokens[1],
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
});

