import { Text, YStack } from 'tamagui';

export default function SendResultScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Send Result</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Result state placeholder. Success and error animations will live here.
      </Text>
    </YStack>
  );
}
