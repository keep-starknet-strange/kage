import { Text, YStack } from 'tamagui';

export default function ShieldedDepositScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Deposit (Shielded)</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Tab structure placeholder. Denomination chips and proof summary pending.
      </Text>
    </YStack>
  );
}
