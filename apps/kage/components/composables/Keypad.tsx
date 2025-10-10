import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { vibrateSelection } from '../../utils/haptics';

export type KeypadValue = string | 'back' | 'clear';

interface KeypadProps {
  layout: KeypadValue[][];
  onPress: (value: KeypadValue) => void;
  renderIcon?: (value: KeypadValue, color: string) => ReactNode;
}

export const Keypad = ({ layout, onPress, renderIcon }: KeypadProps) => {
  const theme = useTheme();
  const surface = theme.colors.surfaceElevated;
  const border = theme.colors.borderStrong;
  const textColor = theme.colors.text;

  const handlePress = (value: KeypadValue) => {
    vibrateSelection();
    onPress(value);
  };

  return (
    <View>
      {layout.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, rowIndex === layout.length - 1 ? { marginBottom: 0 } : undefined]}>
          {row.map((value, valueIndex) => {
            const isClear = value === 'clear';
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                onPress={() => handlePress(value)}
                style={[
                  styles.key,
                  {
                    marginRight: valueIndex === row.length - 1 ? 0 : 12,
                    backgroundColor: isClear ? 'transparent' : surface,
                    borderColor: isClear ? border : 'transparent',
                    borderWidth: isClear ? 1.5 : 0,
                  },
                ]}
              >
                {renderIcon && renderIcon(value, textColor)}
                {!renderIcon && value !== 'back' && (
                  <Text style={[styles.label, { color: textColor }]}>
                    {value === 'clear' ? 'CLR' : value}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
  },
});
