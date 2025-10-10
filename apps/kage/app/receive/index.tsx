import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Text, XStack, YStack } from 'tamagui';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { maskAddress } from '../../utils/format';
import { vibrateSuccess } from '../../utils/haptics';

export default function ReceiveScreen() {
  const { receiveQueue, rotateReceiveAddress } = useWalletStore((state) => ({
    receiveQueue: state.receiveQueue,
    rotateReceiveAddress: state.rotateReceiveAddress,
  }));
  const [copied, setCopied] = useState(false);

  const currentAddress = receiveQueue[0];
  const nextAddress = receiveQueue[1];

  const handleCopy = async () => {
    if (!currentAddress) return;
    await Clipboard.setStringAsync(currentAddress);
    vibrateSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    rotateReceiveAddress();
  };

  if (!currentAddress) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Text color="$colorSecondary">Generating shielded address…</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$lg" gap="$lg" backgroundColor="$background">
      <Text fontSize={28} fontFamily="Inter_600SemiBold">
        Receive privately
      </Text>
      <Card gap="$lg" alignItems="center">
        <QRCode value={currentAddress} size={200} backgroundColor="transparent" color="#4AF0B8" />
        <YStack gap="$xs" alignItems="center">
          <Text fontFamily="JetBrainsMono_500Medium" fontSize={16}>
            {maskAddress(currentAddress, 6)}
          </Text>
          <Text color='$colorMuted' fontSize={13}>
            Rotates after share to keep you unlinkable.
          </Text>
        </YStack>
        <XStack gap="$sm">
          <Button variant="secondary" onPress={handleCopy} disabled={copied}>
            {copied ? 'Copied' : 'Copy & rotate'}
          </Button>
          <Button variant="ghost" onPress={rotateReceiveAddress}>
            Next ID
          </Button>
        </XStack>
      </Card>

      {nextAddress && (
        <Card gap="$sm">
          <Text fontSize={15} color="$colorSecondary">
            Next address queued
          </Text>
          <Text fontFamily="JetBrainsMono_500Medium" fontSize={14}>
            {maskAddress(nextAddress, 6)}
          </Text>
        </Card>
      )}
    </YStack>
  );
}
