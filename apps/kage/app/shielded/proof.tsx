import { Text, YStack } from 'tamagui';

export default function ProofScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Proof Builder</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Proof animation states will be rendered here.
      </Text>
    </YStack>
  );
}
