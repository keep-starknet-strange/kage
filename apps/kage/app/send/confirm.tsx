import { Text, YStack } from 'tamagui';

export default function SendConfirmScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Confirm Send</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Confirmation sheet mock will render here with proof-building animation.
      </Text>
    </YStack>
  );
}
