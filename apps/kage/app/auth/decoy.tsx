import { Text, YStack } from 'tamagui';

export default function DecoyScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={28} fontWeight="600">Decoy Wallet</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Decoy wallet configuration placeholder.
      </Text>
    </YStack>
  );
}
