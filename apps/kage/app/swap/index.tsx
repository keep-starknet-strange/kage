import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowsLeftRight } from 'phosphor-react-native';
import { Text, XStack, YStack, Switch } from 'tamagui';

import { Keypad, KeypadValue } from '../../components/composables/Keypad';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
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
    <YStack flex={1} padding="$lg" gap="$lg" backgroundColor="$background">
      <Text fontSize={28} fontFamily="Inter_600SemiBold">
        Swap assets
      </Text>
      <Card gap="$md">
        <YStack gap="$sm">
          <Text color="$colorSecondary">From</Text>
          <XStack gap="$sm">
            {TOKENS.map((token) => (
              <Button
                key={token.symbol}
                variant={token.symbol === fromToken ? 'primary' : 'secondary'}
                onPress={() => {
                  setFromToken(token.symbol);
                  setToToken(token.symbol === 'USDC' ? 'BTC' : 'USDC');
                }}
              >
                {token.label}
              </Button>
            ))}
          </XStack>
          <Text fontSize={36} fontFamily="Inter_700Bold">{amount || '0'}</Text>
          <Text fontSize={13} color="$colorMuted">
            Shielded balance: {(fromBalance?.shieldedAmount ?? 0).toFixed(2)} {fromToken}
          </Text>
        </YStack>
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$colorSecondary">Private routing</Text>
          <Switch size="$3" checked={privateMode} onCheckedChange={(val) => setPrivateMode(!!val)}>
            <Switch.Thumb backgroundColor="$accent" />
          </Switch>
        </XStack>
      </Card>

      <Card gap="$sm">
        <Text color="$colorSecondary">To</Text>
        <Text fontSize={24} fontFamily="Inter_700Bold">
          {swapPreview.output.toFixed(6)} {toToken}
        </Text>
        <Text fontSize={13} color="$colorMuted">
          Rate ~ {swapPreview.rate} {toToken}/{fromToken}
        </Text>
      </Card>

      {error ? (
        <Text color="$status.error" fontSize={13}>
          {error}
        </Text>
      ) : null}

      <Keypad
        layout={KEYPAD_LAYOUT}
        onPress={handleKeypad}
      />

      <Button onPress={handleReview} disabled={loading}>
        Review swap
      </Button>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <YStack gap="$md">
          <Text fontSize={20} fontFamily="Inter_600SemiBold">
            Confirm swap
          </Text>
          <YStack gap="$xs">
            <Text color="$colorSecondary">From</Text>
            <Text>{amount || '0'} {fromToken}</Text>
          </YStack>
          <YStack gap="$xs">
            <Text color="$colorSecondary">To</Text>
            <Text>{swapPreview.output.toFixed(6)} {toToken}</Text>
          </YStack>
          <Text fontSize={13} color="$colorMuted">
            Includes mocked routing through shielded pools.
          </Text>
          <Button onPress={handleSwap} disabled={loading}>
            {loading ? 'Swapping…' : 'Confirm swap'}
          </Button>
        </YStack>
      </BottomSheet>
    </YStack>
  );
}
