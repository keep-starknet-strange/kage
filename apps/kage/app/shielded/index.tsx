import { Text, YStack } from 'tamagui';

export default function ShieldedScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Shielded Pools</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Deposit and withdraw tabs with proof builder will be assembled here.
      </Text>
    </YStack>
  );
}
