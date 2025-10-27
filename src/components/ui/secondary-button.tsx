import { Pressable, Text, StyleSheet, PressableProps, ViewStyle, View, ActivityIndicator } from "react-native";
import { appTheme } from "@/design/theme";

export interface SecondaryButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export const SecondaryButton = ({ title, onPress, disabled, loading, style, ...props }: SecondaryButtonProps) => {
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
                        color={appTheme.colors.text}
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

const styles = StyleSheet.create({
    button: {
        backgroundColor: appTheme.colors.surface,
        paddingVertical: appTheme.spacing[4],
        paddingHorizontal: appTheme.spacing[6],
        borderRadius: appTheme.radii.md,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: appTheme.colors.border,
    },
    buttonDisabled: {
        backgroundColor: appTheme.colors.surfaceSunken,
        borderColor: appTheme.colors.border,
        opacity: appTheme.opacity.disabled,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: appTheme.spacing[2],
    },
    buttonText: {
        color: appTheme.colors.text,
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    buttonTextDisabled: {
        color: appTheme.colors.textMuted,
    },
    buttonTextLoading: {
        opacity: 0.8,
    },
});

