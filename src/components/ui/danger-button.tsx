import { radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { ActivityIndicator, Pressable, PressableProps, Text, View, ViewStyle } from "react-native";

export interface DangerButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export const DangerButton = ({ title, onPress, disabled, loading, style, ...props }: DangerButtonProps) => {
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
                        color={colorTokens['text.inverted']}
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
        backgroundColor: colorTokens['status.error'],
        paddingVertical: spaceTokens[4],
        paddingHorizontal: spaceTokens[6],
        borderRadius: radiusTokens.md,
        alignItems: "center",
        shadowColor: colorTokens['status.error'],
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        shadowOpacity: 0,
        elevation: 0,
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
        color: colorTokens['text.inverted'],
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

