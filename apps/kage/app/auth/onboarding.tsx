import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield } from 'phosphor-react-native';
import { Text, XStack, YStack, Switch } from 'tamagui';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useUserStore } from '../../stores/useUserStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { generateMnemonicPreview } from '../../utils/mnemonic';

export default function OnboardingScreen() {
  const router = useRouter();
  const paranoidMode = useUserStore((state) => state.paranoidMode);
  const setParanoidMode = useUserStore((state) => state.setParanoidMode);
  const biometricsEnabled = useUserStore((state) => state.biometricsEnabled);
  const setBiometricsEnabled = useUserStore((state) => state.setBiometricsEnabled);
  const setScreenshotGuard = usePrivacyStore((state) => state.setScreenshotGuard);
  const setQuickHideEnabled = usePrivacyStore((state) => state.setQuickHideEnabled);
  const mnemonicPreview = useWalletStore((state) => state.mnemonicPreview);
  const setMnemonicPreview = useWalletStore((state) => state.setMnemonicPreview);
  const hasPasscode = useAuthStore((state) => state.hasPasscode);

  useEffect(() => {
    if (!mnemonicPreview.length) {
      setMnemonicPreview(generateMnemonicPreview());
    }
  }, [mnemonicPreview.length, setMnemonicPreview]);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((supported) => {
        if (!supported) {
          setBiometricsEnabled(false);
        }
      })
      .catch(() => setBiometricsEnabled(false));
  }, [setBiometricsEnabled]);

  useEffect(() => {
    setScreenshotGuard(paranoidMode);
    setQuickHideEnabled(true);
  }, [paranoidMode, setQuickHideEnabled, setScreenshotGuard]);

  const handleContinue = () => {
    router.push({ pathname: '/auth/passcode', params: { phase: hasPasscode ? 'verify' : 'setup' } });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <YStack gap="$lg">
        <YStack gap="$sm" alignItems="center">
          <Shield size={48} color="#4AF0B8" weight="duotone" />
          <Text fontSize={28} fontFamily="Inter_600SemiBold">
            Privacy is STARK Normal
          </Text>
          <Text fontSize={16} color="$colorSecondary" textAlign="center">
            Mocked experience for demos — no real funds move.
          </Text>
        </YStack>

        <Card gap="$md">
          <Text fontSize={16} fontFamily="Inter_600SemiBold">
            12-word preview
          </Text>
          <XStack flexWrap="wrap" gap="$xs">
            {mnemonicPreview.map((word, index) => (
              <YStack
                key={`${word}-${index}`}
                padding="$xs"
                borderRadius="$md"
                backgroundColor="$surfaceElevated"
              >
                <Text fontSize={13} color="$colorSecondary">
                  {index + 1}. {word}
                </Text>
              </YStack>
            ))}
          </XStack>
        </Card>

        <YStack gap="$md">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack maxWidth="70%">
              <Text fontSize={17} fontFamily="Inter_600SemiBold">
                Paranoid Mode
              </Text>
              <Text fontSize={13} color="$colorMuted">
                Auto-lock 15s, block screenshots, obfuscate balances.
              </Text>
            </YStack>
            <Switch
              size="$3"
              checked={paranoidMode}
              onCheckedChange={(val) => setParanoidMode(!!val)}
            >
              <Switch.Thumb backgroundColor="$accent" />
            </Switch>
          </XStack>

          <XStack justifyContent="space-between" alignItems="center">
            <YStack maxWidth="70%">
              <Text fontSize={17} fontFamily="Inter_600SemiBold">
                Biometrics unlock
              </Text>
              <Text fontSize={13} color="$colorMuted">
                Face ID / Touch ID after passcode.
              </Text>
            </YStack>
            <Switch
              size="$3"
              checked={biometricsEnabled}
              onCheckedChange={(val) => setBiometricsEnabled(!!val)}
            >
              <Switch.Thumb backgroundColor="$accent" />
            </Switch>
          </XStack>
        </YStack>

        <Button onPress={handleContinue}>Continue</Button>
      </YStack>
    </ScrollView>
  );
}
