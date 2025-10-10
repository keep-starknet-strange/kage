import { useEffect, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ArrowCircleUpRight, ArrowDownLeft, ArrowsLeftRight, ShieldCheck } from 'phosphor-react-native';
import { ScrollView } from 'react-native';
import { Spinner, Text, XStack, YStack } from 'tamagui';

import { AppHeader } from '../../components/composables/AppHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Meter } from '../../components/ui/Meter';
import { useWalletStore } from '../../stores/useWalletStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { formatCurrency, maskAddress } from '../../utils/format';
import { fromNow } from '../../utils/time';

const ACTIONS = [
  { label: 'Send', icon: ArrowCircleUpRight, href: '/send' },
  { label: 'Receive', icon: ArrowDownLeft, href: '/receive' },
  { label: 'Swap', icon: ArrowsLeftRight, href: '/swap' },
  { label: 'Shielded', icon: ShieldCheck, href: '/shielded' },
];

export default function HomeScreen() {
  const { balances, activity, loading, bootstrap } = useWalletStore((state) => ({
    balances: state.balances,
    activity: state.activity,
    loading: state.loading,
    bootstrap: state.bootstrap,
  }));
  const { balancesHidden, revealBalances } = usePrivacyStore((state) => ({
    balancesHidden: state.balancesHidden,
    revealBalances: state.revealBalances,
  }));

  useEffect(() => {
    bootstrap().catch((error) => console.warn('bootstrap failed', error));
  }, [bootstrap]);

  const totals = useMemo(() => {
    const publicTotal = balances.reduce((acc, balance) => acc + balance.publicAmount, 0);
    const privateTotal = balances.reduce((acc, balance) => acc + balance.shieldedAmount, 0);
    return { publicTotal, privateTotal };
  }, [balances]);

  const privacyScore = useMemo(() => {
    if (!balances.length) return 0.5;
    const ratio = totals.privateTotal / (totals.publicTotal + totals.privateTotal + 1e-6);
    return Math.min(Math.max(ratio, 0.05), 0.95);
  }, [balances.length, totals.privateTotal, totals.publicTotal]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <AppHeader title="Home" />
      <ScrollView
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 120 }}
        onScrollBeginDrag={revealBalances}
      >
        <YStack gap="$lg" paddingHorizontal="$lg">
          <Card padding={0} overflow="hidden" height={132}>
            <LinearGradient
              colors={['rgba(74,240,184,0.18)', 'rgba(155,140,255,0.08)']}
              style={{ flex: 1, padding: 24 }}
            >
              <YStack gap="$xs">
                <Text fontSize={17} color="$colorSecondary">
                  Shielded balance
                </Text>
                <Text fontSize={40} fontFamily="Inter_700Bold">
                  {balancesHidden ? '•••••' : formatCurrency(totals.privateTotal, 'USD')}
                </Text>
                <Text fontSize={13} color="$colorMuted">
                  Public: {formatCurrency(totals.publicTotal, 'USD')}
                </Text>
              </YStack>
            </LinearGradient>
          </Card>

          <XStack gap='$sm' justifyContent='space-between'>
            {ACTIONS.map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href} asChild>
                <Button
                  variant='secondary'
                  flex={1}
                  height={64}
                  borderRadius='$md'
                  flexDirection='column'
                  alignItems='center'
                  justifyContent='center'
                  gap='$xs'
                  disabled={loading}
                >
                  <Icon size={24} color='#4AF0B8' weight='duotone' />
                  <Text fontSize={12} color='$colorSecondary'>
                    {label}
                  </Text>
                </Button>
              </Link>
            ))}
          </XStack>

          <Meter label="Private routing ON" value={privacyScore} />

          <YStack gap="$sm">
            <Text fontSize={17} fontFamily="Inter_600SemiBold">
              Recent Activity
            </Text>
            {activity.slice(0, 4).map((txn) => (
              <Card key={txn.id}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$xs">
                    <Text fontSize={16} fontFamily="Inter_600SemiBold">
                      {txn.type}
                    </Text>
                    <Text fontSize={13} color="$colorMuted">
                      {maskAddress(txn.toFrom)} · {fromNow(txn.timestamp)}
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end">
                    <Text fontFamily="JetBrainsMono_600SemiBold" fontSize={14}>
                      {txn.privacy === 'PRIVATE' ? '•' : ''}
                      {txn.amount.toFixed(4)} {txn.currency}
                    </Text>
                    <Text fontSize={12} color="$colorSecondary">
                      {txn.status}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            ))}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
