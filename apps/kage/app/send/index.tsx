import { Text, YStack } from 'tamagui';

export default function SendScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Send Flow</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Detailed send UI forthcoming. This placeholder ensures routing is connected while the
        full flow is implemented.
      </Text>
    </YStack>
  );
}
