import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Backspace } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Keypad, KeypadValue } from '../../components/composables/Keypad';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/useAuthStore';
import { vibrateError, vibrateSuccess, vibrateSelection } from '../../utils/haptics';

const DIGITS: KeypadValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'back'],
];

export default function PasscodeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ phase?: string }>();
  const phase = params.phase === 'setup' ? 'setup' : 'unlock';
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

  const handleDigit = (digit: KeypadValue) => {
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
    if (typeof digit !== 'string') return;

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
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <View style={styles.pinRow}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                {
                  borderColor: entry[index] ? theme.colors.accent : theme.colors.border,
                  backgroundColor: entry[index] ? theme.colors.accent : 'transparent',
                },
              ]}
            />
          ))}
        </View>
        {phase === 'unlock' && hasDecoy && (
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Enter decoy PIN to open camouflage wallet.</Text>
        )}
        {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      </View>

      <View style={styles.keypad}>
        <Keypad
          layout={DIGITS}
          onPress={handleDigit}
          renderIcon={(value, color) =>
            value === 'back' ? <Backspace size={24} color={color} weight="duotone" /> : null
          }
        />
      </View>

      <Button
        variant="ghost"
        onPress={() => router.replace(phase === 'setup' ? '/auth/decoy' : '/auth/onboarding')}
        style={styles.footerButton}
      >
        {phase === 'setup' ? 'Skip for now' : 'Need help?'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 48,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 24,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pinDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  helper: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  keypad: {
    marginBottom: 32,
  },
  footerButton: {
    alignSelf: 'center',
  },
});
