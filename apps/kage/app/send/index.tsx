import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Backspace } from 'phosphor-react-native';
import { Text, XStack, YStack, Switch } from 'tamagui';

import { AssociationChips } from '../../components/composables/AssociationChips';
import { Keypad, KeypadValue } from '../../components/composables/Keypad';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ASSOCIATION_PRESETS } from '../../domain/constants';
import { AssocSet } from '../../domain/models';
import { useWalletStore } from '../../stores/useWalletStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { formatCurrency, maskAddress } from '../../utils/format';
import { vibrateSuccess, vibrateWarning } from '../../utils/haptics';

const KEYPAD_LAYOUT: KeypadValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export default function SendScreen() {
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

  const formattedAmount = amount || '0';
  const numericAmount = Number(formattedAmount);
  const primaryDisabled = !address || numericAmount <= 0 || loading;

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
      router.replace({
        pathname: '/send/result',
        params: { status: 'success', amount: numericAmount.toString(), address },
      });
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
    <YStack flex={1} padding="$lg" gap="$lg" backgroundColor="$background">
      <YStack gap="$md">
        <Text fontSize={28} fontFamily="Inter_600SemiBold">
          Send funds
        </Text>
        <Card gap="$md">
          <YStack gap="$xs">
            <Text color="$colorSecondary">Amount (USDC)</Text>
            <Text fontSize={36} fontFamily="Inter_700Bold">
              {formattedAmount}
            </Text>
            <Text fontSize={13} color="$colorMuted">
              Available: {balanceUSDC ? balanceUSDC.shieldedAmount.toFixed(2) : '0.00'} USDC
            </Text>
          </YStack>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15} color="$colorSecondary">
              Private routing
            </Text>
            <Switch
              size="$3"
              checked={privateMode}
              onCheckedChange={(val) => setPrivateMode(!!val)}
            >
              <Switch.Thumb backgroundColor="$accent" />
            </Switch>
          </XStack>
        </Card>
      </YStack>

      <YStack gap="$md">
        <AssociationChips selected={assocSet} onSelect={setAssocSet} />
        <Input
          value={address}
          onChangeText={setAddress}
          placeholder="Recipient address"
          autoCapitalize="none"
          keyboardType="default"
          fontFamily="JetBrainsMono_500Medium"
        />
        <Text fontSize={13} color="$colorMuted">
          We rotate IDs after sharing to keep your graph shielded.
        </Text>
      </YStack>

      {error ? (
        <Text color="$status.error" fontSize={13}>
          {error}
        </Text>
      ) : null}

      <Keypad
        layout={KEYPAD_LAYOUT}
        onPress={handleKeypad}
        renderIcon={(value, color) =>
          value === 'back' ? <Backspace size={24} color={color} weight="duotone" /> : null
        }
      />

      <Button onPress={handleReview} disabled={primaryDisabled}>
        Review &amp; send
      </Button>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <YStack gap="$md">
          <Text fontSize={20} fontFamily="Inter_600SemiBold">
            Confirm send
          </Text>
          <YStack gap="$xs">
            <Text color="$colorSecondary">To</Text>
            <Text fontFamily="JetBrainsMono_500Medium">{maskAddress(address)}</Text>
          </YStack>
          <YStack gap="$xs">
            <Text color="$colorSecondary">Amount</Text>
            <Text fontSize={24} fontFamily="Inter_700Bold">
              {numericAmount.toFixed(2)} USDC
            </Text>
          </YStack>
          <YStack gap="$xs">
            <Text color="$colorSecondary">Association set</Text>
            <Text>{selectedPreset.title}</Text>
          </YStack>
          <YStack gap="$xs">
            <Text color="$colorSecondary">Fee estimate</Text>
            <Text>{formatCurrency(feeEstimated, 'USD')} · ETA {selectedPreset.etaSeconds}s</Text>
          </YStack>
          <Button onPress={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Confirm send'}
          </Button>
        </YStack>
      </BottomSheet>
    </YStack>
  );
}
