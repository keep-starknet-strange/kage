import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';

interface ChipProps extends PressableProps {
  label: string;
  selected?: boolean;
  icon?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const Chip = ({ label, selected, icon, style, ...props }: ChipProps) => {
  const theme = useTheme();
  const containerStyle = [
    styles.base,
    {
      borderColor: selected ? theme.colors.accentSoft : theme.colors.border,
      backgroundColor: selected ? theme.colors.accentGlow : theme.colors.glass,
      minHeight: 34,
    },
    style,
  ];

  return (
    <Pressable accessibilityRole="button" style={containerStyle} {...props}>
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.colors.accent : theme.colors.textSecondary,
            marginLeft: icon ? 8 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
