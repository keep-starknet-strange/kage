import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

import { vibrateSelection } from '../../utils/haptics';

export type KageButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface KageButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  children: ReactNode;
  variant?: KageButtonVariant;
  onPress?: (event: GestureResponderEvent) => void;
}

export const Button = ({
  children,
  variant = 'primary',
  onPress,
  disabled,
  style,
  ...touchableProps
}: KageButtonProps) => {
  const theme = useTheme();

  const variantStyles: Record<KageButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.accent,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderStrong,
      borderWidth: 1.25,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const containerStyle: StyleProp<ViewStyle> = [styles.base, variantStyles[variant], disabled && styles.disabled, style];

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    {
      color:
        variant === 'primary'
          ? theme.colors.textInverted
          : variant === 'ghost'
          ? theme.colors.textSecondary
          : theme.colors.text,
    },
  ];

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    vibrateSelection();
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled}
      {...touchableProps}
    >
      {variant === 'primary' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[theme.colors.accent, theme.colors.accentSoft]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {typeof children === 'string' ? <Text style={labelStyle}>{children}</Text> : children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
