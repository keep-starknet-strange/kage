import { Pressable } from 'react-native';
import { Text, useTheme } from 'tamagui';

interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
}

export const Chip = ({ label, selected, icon, onPress }: ChipProps) => {
  const theme = useTheme();
  const background = selected ? theme.accent?.val ?? '#4AF0B8' : 'transparent';
  const border = selected ? theme.accent?.val ?? '#4AF0B8' : theme.border?.val ?? '#26313A';
  const color = selected ? '#0B0F10' : theme.color?.val ?? '#E6F0F2';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: border as string,
        backgroundColor: background as string,
        gap: 8,
      }}
    >
      {icon}
      <Text fontSize={13} fontFamily="Inter_500Medium" color={color}>
        {label}
      </Text>
    </Pressable>
  );
};
