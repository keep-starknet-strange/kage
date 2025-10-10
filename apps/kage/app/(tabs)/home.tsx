import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ArrowCircleUpRight, ArrowDownLeft, ArrowsLeftRight, ShieldCheck } from 'phosphor-react-native';
import { useTheme } from 'styled-components/native';

import { AppHeader } from '../../components/composables/AppHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Meter } from '../../components/ui/Meter';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { formatCurrency, maskAddress } from '../../utils/format';
import { fromNow } from '../../utils/time';

const ACTIONS = [
  { label: 'Send', icon: ArrowCircleUpRight, href: '/send' },
  { label: 'Receive', icon: ArrowDownLeft, href: '/receive' },
  { label: 'Swap', icon: ArrowsLeftRight, href: '/swap' },
  { label: 'Shielded', icon: ShieldCheck, href: '/shielded' },
];

export default function HomeScreen() {
  const theme = useTheme();
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
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <AppHeader title="Home" />
      <ScrollView
        onScrollBeginDrag={revealBalances}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.balanceCard}>
          <LinearGradient
            colors={['rgba(74,240,184,0.18)', 'rgba(155,140,255,0.08)']}
            style={styles.gradient}
          >
            {loading ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : (
              <View>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Shielded balance</Text>
                <Text style={styles.balanceValue}>
                  {balancesHidden ? '•••••' : formatCurrency(totals.privateTotal, 'USD')}
                </Text>
                <Text style={[styles.balanceCaption, { color: theme.colors.textMuted }]}> 
                  Public: {formatCurrency(totals.publicTotal, 'USD')}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Card>

        <View style={styles.actionsRow}>
          {ACTIONS.map(({ label, icon: Icon, href }, index) => (
            <Link key={label} href={href} asChild>
              <Button
                variant="secondary"
                disabled={loading}
                style={[
                  styles.actionButton,
                  {
                    borderColor: theme.colors.borderStrong,
                    marginRight: index === ACTIONS.length - 1 ? 0 : 12,
                  },
                ]}
              >
                <Icon size={24} color={theme.colors.accent} weight="duotone" />
                <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
              </Button>
            </Link>
          ))}
        </View>

        <View style={styles.meterWrapper}>
          <Meter label="Private routing ON" value={privacyScore} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
        </View>
        {activity.slice(0, 4).map((txn) => (
          <Card key={txn.id} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{txn.type}</Text>
                <Text style={[styles.activitySubtitle, { color: theme.colors.textMuted }]}> 
                  {maskAddress(txn.toFrom)} · {fromNow(txn.timestamp)}
                </Text>
              </View>
              <View style={styles.activityAmount}>
                <Text style={styles.activityValue}>
                  {txn.privacy === 'PRIVATE' ? '•' : ''}
                  {txn.amount.toFixed(4)} {txn.currency}
                </Text>
                <Text style={[styles.activityStatus, { color: theme.colors.textSecondary }]}>{txn.status}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  balanceCard: {
    borderWidth: 0,
    padding: 0,
    height: 132,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loaderRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
  },
  balanceValue: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: '#E6F0F2',
  },
  balanceCaption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  activitySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityValue: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_600SemiBold',
    color: '#E6F0F2',
  },
  activityStatus: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  meterWrapper: {
    marginTop: 16,
  },
});
