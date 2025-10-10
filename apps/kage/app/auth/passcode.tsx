import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Backspace } from 'phosphor-react-native';
import { Pressable } from 'react-native';
import { Text, XStack, YStack, useTheme } from 'tamagui';

import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/useAuthStore';
import { vibrateError, vibrateSuccess, vibrateSelection } from '../../utils/haptics';

const DIGITS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['clear', '0', 'back']];

export default function PasscodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phase?: string }>();
  const phase = params.phase === 'setup' ? 'setup' : 'unlock';
  const theme = useTheme();
  const [entry, setEntry] = useState<string[]>([]);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState('');
  const hasDecoy = useAuthStore((state) => state.hasDecoy);
  const setPasscode = useAuthStore((state) => state.setPasscode);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const validatePasscode = useAuthStore((state) => state.validatePasscode);
  const unlock = useAuthStore((state) => state.unlock);

  useEffect(() => {
    setEntry([]);
    setFirstPin(null);
    setError('');
  }, [phase]);

  const title = useMemo(() => {
    if (phase === 'setup' && !firstPin) return 'Create your 6-digit passcode';
    if (phase === 'setup' && firstPin) return 'Confirm your passcode';
    return 'Unlock with passcode';
  }, [phase, firstPin]);

  const handleDigit = async (digit: string) => {
    if (digit === 'back') {
      vibrateSelection();
      setEntry((prev) => prev.slice(0, -1));
      return;
    }
    if (digit === 'clear') {
      vibrateSelection();
      setEntry([]);
      setFirstPin(phase === 'setup' ? null : firstPin);
      setError('');
      return;
    }

    vibrateSelection();
    setEntry((prev) => {
      if (prev.length >= 6) return prev;
      const next = [...prev, digit];
      if (next.length === 6) {
        processPin(next.join(''));
      }
      return next;
    });
  };

  const processPin = async (pin: string) => {
    try {
      if (phase === 'setup') {
        if (!firstPin) {
          setFirstPin(pin);
          setEntry([]);
          return;
        }
        if (firstPin !== pin) {
          vibrateError();
          setError('Passcodes do not match');
          setEntry([]);
          return;
        }
        await setPasscode(pin);
        completeOnboarding();
        unlock('primary');
        vibrateSuccess();
        router.replace('/(tabs)/home');
        return;
      }

      const result = await validatePasscode(pin);
      if (result === 'invalid') {
        vibrateError();
        setError('Incorrect passcode');
        setEntry([]);
        return;
      }
      vibrateSuccess();
      router.replace('/(tabs)/home');
    } catch (err) {
      vibrateError();
      setError('Something went wrong. Try again.');
      setEntry([]);
    }
  };

  return (
    <YStack flex={1} padding="$xl" gap="$xl" backgroundColor="$background" justifyContent="space-between">
      <YStack gap="$md" marginTop="$2xl">
        <Text fontSize={24} fontFamily="Inter_600SemiBold">
          {title}
        </Text>
        <XStack gap="$sm">
          {Array.from({ length: 6 }).map((_, index) => (
            <YStack
              key={index}
              width={44}
              height={44}
              borderRadius="$pill"
              borderWidth={1.5}
              borderColor={entry[index] ? '$accent' : '$border'}
              backgroundColor={entry[index] ? '$accent' : 'transparent'}
            />
          ))}
        </XStack>
        {phase === 'unlock' && hasDecoy && (
          <Text fontSize={13} color="$colorMuted">
            Enter decoy PIN to open camouflage wallet.
          </Text>
        )}
        {error ? (
          <Text color="$status.error" fontSize={13}>
            {error}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$sm">
        {DIGITS.map((row, rowIndex) => (
          <XStack key={rowIndex} justifyContent="space-between" gap="$sm">
            {row.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                onPress={() => handleDigit(value)}
                style={{
                  flex: 1,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: value === 'clear' ? 'transparent' : 'rgba(17,22,26,0.6)',
                  borderWidth: value === 'clear' ? 1.5 : 0,
                  borderColor: 'rgba(38,49,58,0.6)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {value === 'back' ? (
                  <Backspace size={24} color="#A6B3B8" weight="duotone" />
                ) : (
                  <Text fontSize={24} fontFamily="Inter_600SemiBold" color="#E6F0F2">
                    {value === 'clear' ? 'CLR' : value}
                  </Text>
                )}
              </Pressable>
            ))}
          </XStack>
        ))}
      </YStack>

      {phase === 'setup' ? (
        <Button variant="ghost" onPress={() => router.replace('/auth/decoy')}>
          Skip for now
        </Button>
      ) : (
        <Button variant="ghost" onPress={() => router.replace('/auth/onboarding')}>
          Need help?
        </Button>
      )}
    </YStack>
  );
}
