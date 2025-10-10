import { useEffect } from 'react';
import { ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';

import { useWalletStore } from '../../stores/useWalletStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { formatShortCurrency } from '../../utils/format';

export default function HomeScreen() {
  const { balances, activity, loading, bootstrap } = useWalletStore((state) => ({
    balances: state.balances,
    activity: state.activity,
    loading: state.loading,
    bootstrap: state.bootstrap,
  }));
  const { privateMode } = usePrivacyStore();

  useEffect(() => {
    bootstrap().catch((error) => console.warn('bootstrap failed', error));
  }, [bootstrap]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <YStack space="$md">
          <Text fontSize={20} fontWeight="600">
            {privateMode ? 'Shielded Balances' : 'Balances'}
          </Text>
          {loading ? (
            <Spinner size="large" color="$accent" />
          ) : (
            <YStack space="$sm">
              {balances.map((balance) => (
                <XStack
                  key={balance.currency}
                  justifyContent="space-between"
                  alignItems="center"
                  padding="$md"
                  borderRadius="$lg"
                  backgroundColor="$surfaceElevated"
                >
                  <YStack>
                    <Text fontSize={17} fontWeight="500">
                      {balance.currency}
                    </Text>
                    <Text color="$colorMuted" fontSize={13}>
                      Public: {formatShortCurrency(balance.publicAmount, balance.currency)}
                    </Text>
                  </YStack>
                  <Text fontSize={24} fontWeight="600">
                    {formatShortCurrency(balance.shieldedAmount, balance.currency)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
          <YStack space="$sm">
            <Text fontSize={17} fontWeight="600">
              Recent Activity
            </Text>
            {activity.slice(0, 5).map((txn) => (
              <XStack
                key={txn.id}
                justifyContent="space-between"
                alignItems="center"
                padding="$md"
                borderRadius="$md"
                backgroundColor="$surfaceElevated"
              >
                <YStack>
                  <Text fontSize={15} fontWeight="500">
                    {txn.type}
                  </Text>
                  <Text color="$colorMuted" fontSize={13}>
                    {new Date(txn.timestamp).toLocaleString()}
                  </Text>
                </YStack>
                <Text fontSize={15} fontFamily="JetBrainsMono_600SemiBold">
                  {txn.privacy === 'PRIVATE' ? '•' : ''}
                  {txn.amount.toFixed(4)} {txn.currency}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
