import { MotiView } from 'moti';
import { Text, XStack } from 'tamagui';

interface MeterProps {
  label: string;
  value: number; // 0-1
}

export const Meter = ({ label, value }: MeterProps) => {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <XStack
      height={28}
      borderRadius="$pill"
      backgroundColor="$surfaceElevated"
      alignItems="center"
      paddingHorizontal="$sm"
      gap="$sm"
    >
      <XStack flex={1} height={8} borderRadius={4} backgroundColor="$border" overflow="hidden">
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ type: 'timing', duration: 240 }}
          style={{ backgroundColor: '#4AF0B8', height: '100%' }}
        />
      </XStack>
      <Text fontSize={13} color="$colorSecondary">
        {label}
      </Text>
    </XStack>
  );
};
