import { Text, YStack } from 'tamagui';

export default function SwapScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Swap</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Private swap router mock and shielded balance usage will land here.
      </Text>
    </YStack>
  );
}
