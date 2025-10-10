import { Text, YStack } from 'tamagui';

export default function ReceiveScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Receive</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Rotating address UI will render here with QR export and copy interactions.
      </Text>
    </YStack>
  );
}
