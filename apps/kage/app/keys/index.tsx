import { useEffect } from 'react';
import { ScrollView, Text, XStack, YStack, Button } from 'tamagui';
import { Link } from 'expo-router';

import { useWalletStore } from '../../stores/useWalletStore';
import { fromNow } from '../../utils/time';

export default function KeysScreen() {
  const { viewingKeys, bootstrap } = useWalletStore((state) => ({
    viewingKeys: state.viewingKeys,
    bootstrap: state.bootstrap,
  }));

  useEffect(() => {
    if (!viewingKeys.length) {
      bootstrap().catch(() => undefined);
    }
  }, [viewingKeys.length, bootstrap]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={20} fontWeight="600">
            Viewing Keys
          </Text>
          <Link href="/keys/grant" asChild>
            <Button size="$3" backgroundColor="$accent" color="$background" borderRadius="$pill">
              Grant
            </Button>
          </Link>
        </XStack>
        {viewingKeys.map((key) => (
          <YStack key={key.id} padding="$md" borderRadius="$md" backgroundColor="$surfaceElevated" space="$xs">
            <Text fontSize={16} fontWeight="600">
              {key.label}
            </Text>
            <Text fontSize={13} color="$colorMuted">
              Issued {fromNow(key.createdAt)}
            </Text>
            {key.lastAccessAt && (
              <Text fontSize={13} color="$colorSecondary">
                Last accessed {fromNow(key.lastAccessAt)}
              </Text>
            )}
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
