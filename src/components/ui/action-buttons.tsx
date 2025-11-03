import { appTheme } from '@/design/theme';
import { SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

export interface ActionButtonProps {
    icon: SymbolViewProps['name'];
    label: string;
    onPress: () => void;
    disabled?: boolean;
}

export interface ActionButtonsRowProps {
    onFund?: () => void;
    onTransfer?: () => void;
    onWithdraw?: () => void;
    style?: ViewStyle;
}

const ActionButton = ({ icon, label, onPress, disabled = false }: ActionButtonProps) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.actionButton,
                pressed && !disabled && styles.actionButtonPressed,
                disabled && styles.actionButtonDisabled,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={[
                styles.iconCircle,
                disabled && styles.iconCircleDisabled,
            ]}>
                <IconSymbol
                    name={icon}
                    size={24}
                    color={appTheme.colors.background}
                />
            </View>
            <Text style={[
                styles.label,
                disabled && styles.labelDisabled,
            ]}>
                {label}
            </Text>
        </Pressable>
    );
};

export default ActionButton;

const styles = StyleSheet.create({
    actionButton: {
        alignItems: 'center',
        gap: appTheme.spacing[2],
    },
    actionButtonPressed: {
        opacity: 0.7,
    },
    actionButtonDisabled: {
        opacity: appTheme.opacity.disabled,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: appTheme.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: appTheme.colors.shadowPrimary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: appTheme.colors.border,
    },
    iconCircleDisabled: {
        backgroundColor: appTheme.colors.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: appTheme.colors.text,
        textAlign: 'center',
    },
    labelDisabled: {
        color: appTheme.colors.textMuted,
    },
});

