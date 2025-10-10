import { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { vibrateSelection } from '../../utils/haptics';

export type KeypadValue = string | 'back' | 'clear';

interface KeypadProps {
  layout: KeypadValue[][];
  onPress: (value: KeypadValue) => void;
  renderIcon?: (value: KeypadValue, color: string) => ReactNode;
}

export const Keypad = ({ layout, onPress, renderIcon }: KeypadProps) => {
  const theme = useTheme();
  const surface = theme.surfaceElevated?.val ?? 'rgba(17,22,26,0.6)';
  const border = theme.border?.val ?? 'rgba(38,49,58,0.6)';
  const textColor = theme.color?.val ?? '#E6F0F2';

  const handlePress = (value: KeypadValue) => {
    vibrateSelection();
    onPress(value);
  };

  return (
    <YStack gap="$sm">
      {layout.map((row, rowIndex) => (
        <XStack key={rowIndex} justifyContent="space-between" gap="$sm">
          {row.map((value) => (
            <Pressable
              key={value}
              onPress={() => handlePress(value)}
              accessibilityRole="button"
              style={{
                flex: 1,
                height: 64,
                borderRadius: 16,
                backgroundColor: value === 'clear' ? 'transparent' : surface,
                borderWidth: value === 'clear' ? 1.5 : 0,
                borderColor: border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderIcon && renderIcon(value, textColor)}
              {!renderIcon && value !== 'back' && (
                <Text fontSize={24} fontFamily="Inter_600SemiBold" color={textColor}>
                  {value === 'clear' ? 'CLR' : value}
                </Text>
              )}
            </Pressable>
          ))}
        </XStack>
      ))}
    </YStack>
  );
};
