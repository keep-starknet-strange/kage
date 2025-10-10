import { Text, YStack } from 'tamagui';

export default function OnboardingScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text fontSize={28} fontWeight="600">Onboarding</Text>
      <Text color="$colorMuted" textAlign="center" paddingHorizontal="$xl" marginTop="$md">
        Coach marks, paranoid mode toggles, and biometrics setup will live here.
      </Text>
    </YStack>
  );
}
