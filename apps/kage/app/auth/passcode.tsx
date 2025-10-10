import { Text, YStack } from 'tamagui';

export default function PasscodeScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={28} fontWeight="600">Set Passcode</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Passcode keypad and decoy PIN enrollment UI placeholder.
      </Text>
    </YStack>
  );
}
