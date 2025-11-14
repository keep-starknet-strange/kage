import { opacityTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { ActivityIndicator, Pressable, PressableProps, Text, View, ViewStyle } from "react-native";

export interface SecondaryButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export const SecondaryButton = ({ title, onPress, disabled, loading, style, ...props }: SecondaryButtonProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const isDisabled = disabled || loading;

    return (
        <Pressable
            style={[
                styles.button,
                isDisabled && styles.buttonDisabled,
                style
            ]}
            onPress={onPress}
            disabled={isDisabled}
            {...props}
        >
            <View style={styles.content}>
                {loading && (
                    <ActivityIndicator
                        size="small"
                        color={colorTokens['text.primary']}
                        style={styles.loader}
                    />
                )}
                <Text
                    style={[
                        styles.buttonText,
                        isDisabled && styles.buttonTextDisabled,
                        loading && styles.buttonTextLoading
                    ]}
                >
                    {title}
                </Text>
            </View>
        </Pressable>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    button: {
        backgroundColor: colorTokens['bg.elevated'],
        paddingVertical: spaceTokens[4],
        paddingHorizontal: spaceTokens[6],
        borderRadius: radiusTokens.md,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colorTokens['border.subtle'],
    },
    buttonDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        borderColor: colorTokens['border.subtle'],
        opacity: opacityTokens.disabled,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: spaceTokens[2],
    },
    buttonText: {
        color: colorTokens['text.primary'],
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    buttonTextDisabled: {
        color: colorTokens['text.muted'],
    },
    buttonTextLoading: {
        opacity: 0.8,
    },
}));

