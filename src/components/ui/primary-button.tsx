import { Pressable, Text, StyleSheet, PressableProps, ViewStyle, View, ActivityIndicator } from "react-native";
import { appTheme } from "@/design/theme";

export interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export const PrimaryButton = ({ title, onPress, disabled, loading, style, ...props }: PrimaryButtonProps) => {
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
                        color={isDisabled ? appTheme.colors.textMuted : appTheme.colors.textInverted}
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
        backgroundColor: appTheme.colors.accent,
        paddingVertical: appTheme.spacing[4],
        paddingHorizontal: appTheme.spacing[6],
        borderRadius: appTheme.radii.md,
        alignItems: "center",
        shadowColor: appTheme.colors.shadowPrimary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: appTheme.colors.surfaceSunken,
        shadowOpacity: 0,
        elevation: 0,
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
        color: appTheme.colors.textInverted,
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

