import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Backspace } from 'phosphor-react-native';
import { useTheme } from 'styled-components/native';

import { AssociationChips } from '../../components/composables/AssociationChips';
import { Keypad, KeypadValue } from '../../components/composables/Keypad';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ASSOCIATION_PRESETS } from '../../domain/constants';
import { AssocSet } from '../../domain/models';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { formatCurrency, maskAddress } from '../../utils/format';
import { vibrateSuccess, vibrateWarning } from '../../utils/haptics';

const KEYPAD_LAYOUT: KeypadValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export default function SendScreen() {
  const theme = useTheme();
  const router = useRouter();
  const balances = useWalletStore((state) => state.balances);
  const send = useWalletStore((state) => state.send);
  const privateMode = usePrivacyStore((state) => state.privateMode);
  const setPrivateMode = usePrivacyStore((state) => state.setPrivateMode);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [assocSet, setAssocSet] = useState<AssocSet>('RECOMMENDED');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPreset = ASSOCIATION_PRESETS.find((preset) => preset.id === assocSet)!;
  const feeEstimated = useMemo(() => 0.0005 * selectedPreset.feeModifier, [selectedPreset.feeModifier]);
  const balanceUSDC = balances.find((balance) => balance.currency === 'USDC');

  const formattedAmount = amount || '0';
  const numericAmount = Number(formattedAmount);
  const primaryDisabled = !address || numericAmount <= 0 || loading;

  const handleKeypad = (value: KeypadValue) => {
    if (value === 'back') {
      setAmount((prev) => prev.slice(0, -1));
      return;
    }
    if (value === 'clear') {
      setAmount('');
      return;
    }
    if (value === '.' && amount.includes('.')) return;
    if (amount.length >= 10) return;
    setAmount((prev) => `${prev}${value}`);
  };

  const handleReview = () => {
    if (!address) {
      setError('Recipient address required');
      vibrateWarning();
      return;
    }
    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      vibrateWarning();
      return;
    }
    setError('');
    setSheetOpen(true);
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      await send({
        to: address,
        amount: numericAmount,
        currency: 'USDC',
        privacy: privateMode ? 'PRIVATE' : 'PUBLIC',
        assocSet,
      });
      setSheetOpen(false);
      vibrateSuccess();
      router.replace({ pathname: '/send/result', params: { status: 'success', amount: numericAmount.toString(), address } });
      setAmount('');
      setAddress('');
    } catch (err) {
      setSheetOpen(false);
      router.replace({ pathname: '/send/result', params: { status: 'error' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.text }]}>Send funds</Text>
        <Card style={styles.summaryCard}>
          <View>
            <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Amount (USDC)</Text>
            <Text style={[styles.amount, { color: theme.colors.text }]}>{formattedAmount}</Text>
            <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
              Available: {balanceUSDC ? balanceUSDC.shieldedAmount.toFixed(2) : '0.00'} USDC
            </Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>Private routing</Text>
            <Switch
              value={privateMode}
              onValueChange={(val) => setPrivateMode(val)}
              thumbColor={privateMode ? theme.colors.accent : '#FFFFFF'}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
            />
          </View>
        </Card>

        <AssociationChips selected={assocSet} onSelect={setAssocSet} />
        <Input
          value={address}
          onChangeText={setAddress}
          placeholder="Recipient address"
          autoCapitalize="none"
          keyboardType="default"
          style={styles.input}
        />
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
          We rotate IDs after sharing to keep your graph shielded.
        </Text>

        {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

        <View style={styles.keypadWrapper}>
          <Keypad
            layout={KEYPAD_LAYOUT}
            onPress={handleKeypad}
            renderIcon={(value, color) =>
              value === 'back' ? <Backspace size={24} color={color} weight="duotone" /> : null
            }
          />
        </View>

        <Button onPress={handleReview} disabled={primaryDisabled} style={styles.primaryButton}>
          Review &amp; send
        </Button>
      </ScrollView>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Confirm send</Text>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>To</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>{maskAddress(address)}</Text>
          </View>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>
              {numericAmount.toFixed(2)} USDC
            </Text>
          </View>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>Association set</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>{selectedPreset.title}</Text>
          </View>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>Fee estimate</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>
              {formatCurrency(feeEstimated, 'USD')} · ETA {selectedPreset.etaSeconds}s
            </Text>
          </View>
          <Button onPress={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Confirm send'}
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 160,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryValueBlock: {
    marginBottom: 16,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  amount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    marginTop: 12,
    marginBottom: 12,
  },
  helper: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  keypadWrapper: {
    marginBottom: 24,
  },
  primaryButton: {
    marginBottom: 24,
  },
  sheetContent: {},
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  sheetRow: {
    marginBottom: 4,
  },
  sheetLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  sheetValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
});
