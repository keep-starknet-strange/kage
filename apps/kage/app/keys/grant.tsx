import { Text, YStack } from 'tamagui';

export default function GrantKeyScreen() {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      <Text fontSize={24} fontWeight="600">Grant Viewing Key</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Form for granting viewing keys will be added here shortly.
      </Text>
    </YStack>
  );
}
