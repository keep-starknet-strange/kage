import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, WarningCircle } from 'phosphor-react-native';
import { Text, YStack } from 'tamagui';

import { Button } from '../../components/ui/Button';
import { maskAddress } from '../../utils/format';

export default function SendResultScreen() {
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
    <YStack flex={1} padding="$xl" gap="$lg" alignItems="center" justifyContent="center" backgroundColor="$background">
      {success ? (
        <CheckCircle size={72} color="#4AF0B8" weight="duotone" />
      ) : (
        <WarningCircle size={72} color="#FF5D5D" weight="duotone" />
      )}
      <Text fontSize={28} fontFamily="Inter_600SemiBold" textAlign="center">
        {copy.title}
      </Text>
      <Text fontSize={16} color="$colorSecondary" textAlign="center">
        {copy.subtitle}
      </Text>
      <Button onPress={() => router.replace('/(tabs)/home')}>Back to Home</Button>
    </YStack>
  );
}
