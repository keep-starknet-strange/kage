import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';

import { Keypad, KeypadValue } from '../../components/composables/Keypad';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Card } from '../../components/ui/Card';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { formatCurrency } from '../../utils/format';
import { vibrateSuccess, vibrateWarning } from '../../utils/haptics';

const TOKENS: Array<{ symbol: 'USDC' | 'BTC'; label: string }> = [
  { symbol: 'USDC', label: 'USDC' },
  { symbol: 'BTC', label: 'wBTC' },
];

const KEYPAD_LAYOUT: KeypadValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export default function SwapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const balances = useWalletStore((state) => state.balances);
  const swap = useWalletStore((state) => state.swap);
  const privateMode = usePrivacyStore((state) => state.privateMode);
  const setPrivateMode = usePrivacyStore((state) => state.setPrivateMode);
  const [fromToken, setFromToken] = useState<'USDC' | 'BTC'>('USDC');
  const [toToken, setToToken] = useState<'USDC' | 'BTC'>('BTC');
  const [amount, setAmount] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromBalance = balances.find((balance) => balance.currency === fromToken);
  const swapPreview = useMemo(() => {
    const numeric = Number(amount || '0');
    const rate = fromToken === 'USDC' ? 0.000018 : 54000;
    const output = numeric * rate;
    return { rate, output };
  }, [amount, fromToken]);

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
    const numeric = Number(amount || '0');
    if (numeric <= 0) {
      vibrateWarning();
      setError('Amount must be greater than zero');
      return;
    }
    if (numeric > (fromBalance?.shieldedAmount ?? 0)) {
      vibrateWarning();
      setError('Insufficient shielded balance');
      return;
    }
    if (fromToken === toToken) {
      vibrateWarning();
      setError('Tokens must differ');
      return;
    }
    setError('');
    setSheetOpen(true);
  };

  const handleSwap = async () => {
    const numeric = Number(amount || '0');
    setLoading(true);
    try {
      await swap({ fromCurrency: fromToken, toCurrency: toToken, amount: numeric, privacy: privateMode ? 'PRIVATE' : 'PUBLIC' });
      setSheetOpen(false);
      vibrateSuccess();
      router.replace({
        pathname: '/send/result',
        params: {
          status: 'success',
          amount: numeric.toString(),
          address: `${fromToken}→${toToken}`,
        },
      });
      setAmount('');
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Swap assets</Text>
        <Card style={styles.swapCard}>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>From</Text>
          <View style={styles.tokenRow}>
            {TOKENS.map((token, index) => (
              <Button
                key={token.symbol}
                variant={token.symbol === fromToken ? 'primary' : 'secondary'}
                onPress={() => {
                  setFromToken(token.symbol);
                  setToToken(token.symbol === 'USDC' ? 'BTC' : 'USDC');
                }}
                style={[styles.tokenButton, { marginRight: index === TOKENS.length - 1 ? 0 : 12 }]}
              >
                {token.label}
              </Button>
            ))}
          </View>
          <Text style={[styles.amount, { color: theme.colors.text }]}>{amount || '0'}</Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Shielded balance: {(fromBalance?.shieldedAmount ?? 0).toFixed(2)} {fromToken}</Text>
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

        <Card style={styles.previewCard}>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>To</Text>
          <Text style={[styles.previewValue, { color: theme.colors.text }]}>
            {swapPreview.output.toFixed(6)} {toToken}
          </Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Rate ~ {swapPreview.rate} {toToken}/{fromToken}</Text>
        </Card>

        {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

        <View style={styles.keypadWrapper}>
          <Keypad layout={KEYPAD_LAYOUT} onPress={handleKeypad} />
        </View>

        <Button onPress={handleReview} disabled={loading} style={styles.primaryButton}>
          Review swap
        </Button>
      </ScrollView>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Confirm swap</Text>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>From</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>
              {amount || '0'} {fromToken}
            </Text>
          </View>
          <View style={styles.sheetRow}>
            <Text style={[styles.sheetLabel, { color: theme.colors.textSecondary }]}>To</Text>
            <Text style={[styles.sheetValue, { color: theme.colors.text }]}>
              {swapPreview.output.toFixed(6)} {toToken}
            </Text>
          </View>
          <Text style={[styles.sheetHelper, { color: theme.colors.textMuted }]}>Includes mocked routing through shielded pools.</Text>
          <Button onPress={handleSwap} disabled={loading}>
            {loading ? 'Swapping…' : 'Confirm swap'}
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
  swapCard: {
    marginBottom: 24,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tokenButton: {},
  amount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  previewCard: {
    marginBottom: 24,
  },
  previewValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
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
    marginBottom: 12,
  },
  sheetRow: {
    marginBottom: 8,
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
  sheetHelper: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginVertical: 12,
  },
});
