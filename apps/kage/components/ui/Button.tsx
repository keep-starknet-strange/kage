import { Button as TamaguiButton, ButtonProps, styled } from 'tamagui';

import { vibrateSelection } from '../../utils/haptics';

export type KageButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface KageButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: KageButtonVariant;
}

const BaseButton = styled(TamaguiButton, {
  height: 52,
  borderRadius: '$lg',
  fontFamily: 'Inter_600SemiBold',
  fontSize: 17,
  letterSpacing: 0,
  pressStyle: {
    scale: 0.98,
  },
});

const variantStyles: Record<KageButtonVariant, Partial<ButtonProps>> = {
  primary: {
    backgroundColor: '$accent',
    color: '$background',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '$borderStrong',
    color: '$color',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '$color',
    hoverStyle: { backgroundColor: '$glass' },
    pressStyle: { backgroundColor: '$glass', scale: 0.98 },
  },
};

export const Button = ({ variant = 'primary', onPress, ...props }: KageButtonProps) => {
  const variantProps = variantStyles[variant];

  const handlePress: ButtonProps['onPress'] = (event) => {
    vibrateSelection();
    onPress?.(event);
  };

  return <BaseButton {...variantProps} {...props} onPress={handlePress} />;
};
