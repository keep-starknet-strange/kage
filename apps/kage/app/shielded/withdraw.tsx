import { Text, YStack } from 'tamagui';

export default function ShieldedWithdrawScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Withdraw (Shielded)</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Association set selection and proof builder will be wired here soon.
      </Text>
    </YStack>
  );
}
