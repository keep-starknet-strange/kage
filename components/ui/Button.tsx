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
      borderColor: theme.colors.accent,
      borderWidth: 1,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variantStyles[variant],
    disabled && styles.disabled,
    style,
  ];

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    {
      color: variant === 'primary' ? theme.colors.background : theme.colors.text,
    },
  ];

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    vibrateSelection();
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled}
      {...touchableProps}
    >
      {typeof children === 'string' ? <Text style={labelStyle}>{children}</Text> : children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  disabled: {
    opacity: 0.5,
  },
});
