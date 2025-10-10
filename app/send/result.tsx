import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, WarningCircle } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Button } from '../../components/ui/Button';
import { maskAddress } from '../../utils/format';

export default function SendResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string; amount?: string; address?: string }>();
  const success = params.status === 'success';

  const copy = useMemo(() => {
    if (success) {
      return {
        title: 'Send complete',
        subtitle: params.address ? `Sent to ${maskAddress(params.address)}` : 'Mock transaction recorded.',
      };
    }
    return {
      title: 'Send failed',
      subtitle: 'The mocked network rejected this transfer. Try again.',
    };
  }, [params.address, success]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      {success ? (
        <CheckCircle size={72} color={theme.colors.accent} weight="duotone" />
      ) : (
        <WarningCircle size={72} color={theme.colors.error} weight="duotone" />
      )}
      <Text style={[styles.title, { color: theme.colors.text }]}>{copy.title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{copy.subtitle}</Text>
      <Button onPress={() => router.replace('/(tabs)/home')}>Back to Home</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
});
