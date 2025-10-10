import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { maskAddress } from '../../utils/format';
import { vibrateSuccess } from '../../utils/haptics';

export default function ReceiveScreen() {
  const theme = useTheme();
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
      <View style={[styles.screen, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: theme.colors.textSecondary }}>Generating shielded address…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Receive privately</Text>
      <Card style={styles.qrCard}>
        <QRCode value={currentAddress} size={200} backgroundColor="transparent" color={theme.colors.accent} />
        <Text style={[styles.address, { color: theme.colors.text }]}>{maskAddress(currentAddress, 6)}</Text>
        <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Rotates after share to keep you unlinkable.</Text>
        <View style={styles.actionsRow}>
          <Button variant="secondary" onPress={handleCopy} disabled={copied} style={styles.actionButton}>
            {copied ? 'Copied' : 'Copy & rotate'}
          </Button>
          <Button variant="ghost" onPress={rotateReceiveAddress} style={styles.actionButton}>
            Next ID
          </Button>
        </View>
        {copied && (
          <Text style={[styles.copiedNote, { color: theme.colors.success }]}>Copied. Next address armed.</Text>
        )}
      </Card>

      {nextAddress && (
        <Card style={styles.nextCard}>
          <Text style={[styles.nextTitle, { color: theme.colors.textSecondary }]}>Next address queued</Text>
          <Text style={[styles.nextAddress, { color: theme.colors.text }]}>{maskAddress(nextAddress, 6)}</Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 24,
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  address: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 16,
    marginTop: 16,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButton: {
    marginHorizontal: 8,
  },
  copiedNote: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  nextCard: {
    marginTop: 16,
  },
  nextTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  nextAddress: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
