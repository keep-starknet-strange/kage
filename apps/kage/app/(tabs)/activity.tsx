import { useEffect } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { useWalletStore } from '../../stores/useWalletStore';
import { formatShortCurrency } from '../../utils/format';
import { fromNow } from '../../utils/time';

export default function ActivityScreen() {
  const { activity, refreshActivity, bootstrap } = useWalletStore((state) => ({
    activity: state.activity,
    refreshActivity: state.refreshActivity,
    bootstrap: state.bootstrap,
  }));

  useEffect(() => {
    if (!activity.length) {
      bootstrap().catch(() => undefined);
    } else {
      refreshActivity().catch(() => undefined);
    }
  }, [activity.length, bootstrap, refreshActivity]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        {activity.map((txn) => (
          <XStack
            key={txn.id}
            justifyContent="space-between"
            alignItems="center"
            padding="$md"
            borderRadius="$md"
            backgroundColor="$surfaceElevated"
          >
            <YStack>
              <Text fontSize={15} fontWeight="600">
                {txn.type}
              </Text>
              <Text color={txn.privacy === 'PRIVATE' ? '$accent' : '$colorSecondary'} fontSize={13}>
                {txn.privacy}
              </Text>
            </YStack>
            <YStack alignItems="flex-end">
              <Text fontFamily="JetBrainsMono_600SemiBold" fontSize={14}>
                {formatShortCurrency(txn.amount, txn.currency)}
              </Text>
              <Text color="$colorMuted" fontSize={12}>
                {fromNow(txn.timestamp)}
              </Text>
            </YStack>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
