import { Text, YStack } from 'tamagui';

export default function RevokeKeyScreen() {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Revoke Viewing Key</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Revocation confirmation placeholder.
      </Text>
    </YStack>
  );
}
