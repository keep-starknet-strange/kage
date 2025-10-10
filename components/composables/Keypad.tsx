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
            const isAction = value === 'clear' || value === 'back';
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                onPress={() => handlePress(value)}
                style={[
                  styles.key,
                  {
                    marginRight: valueIndex === row.length - 1 ? 0 : 12,
                    backgroundColor: isAction ? theme.colors.surface : surface,
                    borderColor: isAction ? border : 'transparent',
                    borderWidth: isAction ? 1 : 0,
                  },
                ]}
              >
                {value === 'back' && renderIcon ? renderIcon(value, textColor) : null}
                {value === 'clear' && <Text style={[styles.actionLabel, { color: textColor }]}>CLR</Text>}
                {typeof value === 'string' && value !== 'clear' && value !== 'back' && (
                  <Text style={[styles.label, { color: textColor }]}>{value}</Text>
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
  actionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
});
