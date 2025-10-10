import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ArrowCircleUpRight, ArrowDownLeft, ArrowsLeftRight } from 'phosphor-react-native';
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
  { label: 'Receive', icon: ArrowDownLeft, href: '/receive' },
  { label: 'Send', icon: ArrowCircleUpRight, href: '/send' },
  { label: 'Pay', icon: ArrowsLeftRight, href: '/swap' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const balances = useWalletStore((state) => state.balances);
  const activity = useWalletStore((state) => state.activity);
  const loading = useWalletStore((state) => state.loading);
  const bootstrap = useWalletStore((state) => state.bootstrap);
  const balancesHidden = usePrivacyStore((state) => state.balancesHidden);
  const revealBalances = usePrivacyStore((state) => state.revealBalances);

  useEffect(() => {
    bootstrap().catch((error) => console.warn('bootstrap failed', error));
  }, [bootstrap]);

  const totals = useMemo(() => {
    const strk = balances.find((balance) => balance.currency === 'STRK');
    const totalUsd = balances
      .filter((balance) => balance.currency !== 'STRK')
      .reduce((acc, balance) => acc + balance.shieldedAmount + balance.publicAmount, 0);
    return {
      strkValue: (strk?.shieldedAmount ?? 0) + (strk?.publicAmount ?? 0),
      usdValue: totalUsd,
    };
  }, [balances]);

  const privacyScore = useMemo(() => {
    if (!balances.length) return 0.5;
    const shielded = balances.reduce((acc, item) => acc + item.shieldedAmount, 0);
    const total = balances.reduce((acc, item) => acc + item.shieldedAmount + item.publicAmount, 0) + 1e-6;
    const ratio = shielded / total;
    return Math.min(Math.max(ratio, 0.05), 0.95);
  }, [balances]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.headerRow}>
        <Image source={require('../../kage-logo.png')} style={styles.logo} resizeMode='contain' />
        <Text style={[styles.brand, { color: theme.colors.text }]}>KAGE Pay</Text>
      </View>
      <AppHeader title="Home" />
      <ScrollView
        onScrollBeginDrag={revealBalances}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.balanceCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F6F7F8']}
            style={styles.gradient}
          >
            {loading ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : (
              <View>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Shielded balance</Text>
                <Text style={[styles.balanceValue, { color: theme.colors.text }] }>
                  {balancesHidden ? '•••••' : `${totals.strkValue.toFixed(2)} STRK`}
                </Text>
                <Text style={[styles.balanceCaption, { color: theme.colors.textMuted }]}> 
                  Multi-asset: {formatCurrency(totals.usdValue, 'USD')}
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
              <View style={[styles.activityIconWrap, { borderColor: theme.colors.border }]}>
                <Text style={[styles.activityIcon, { color: theme.colors.text }]}>{txn.type.slice(0, 1)}</Text>
              </View>
              <View style={styles.activityCopy}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{txn.type}</Text>
                <Text style={[styles.activitySubtitle, { color: theme.colors.textMuted }]}>{maskAddress(txn.toFrom)} · {fromNow(txn.timestamp)}</Text>
              </View>
              <View style={styles.activityAmount}>
                <Text style={[styles.activityValue, { color: theme.colors.text }]}>{txn.privacy === 'PRIVATE' ? '•' : ''}{txn.amount.toFixed(4)} {txn.currency}</Text>
                <Text style={[styles.activityStatus, { color: theme.colors.textSecondary }]}>{txn.status}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
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
  },
  balanceCaption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
    letterSpacing: 0.3,
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
    alignItems: 'center',
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8D9DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIcon: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
  activityCopy: {
    flex: 1,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityValue: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_600SemiBold',
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
