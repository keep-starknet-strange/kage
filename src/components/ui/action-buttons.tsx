import { fontStyles, opacityTokens, spaceTokens } from '@/design/tokens';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { IconSymbol, IconSymbolName } from './icon-symbol';

export interface ActionButtonProps {
    icon: IconSymbolName;
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
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    
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
                    color={colorTokens['brand.accent']}
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

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    actionButton: {
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    actionButtonPressed: {
        opacity: 0.7,
    },
    actionButtonDisabled: {
        opacity: opacityTokens.disabled,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colorTokens['brand.glow'],
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
    },
    iconCircleDisabled: {
        backgroundColor: colorTokens['brand.glow'],
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    label: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
        textAlign: 'center',
    },
    labelDisabled: {
        color: colorTokens['text.muted'],
    },
}));

