import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { formatShortCurrency } from '../../utils/format';
import { fromNow } from '../../utils/time';

export default function ActivityScreen() {
  const theme = useTheme();
  const activity = useWalletStore((state) => state.activity);
  const refreshActivity = useWalletStore((state) => state.refreshActivity);
  const bootstrap = useWalletStore((state) => state.bootstrap);

  useEffect(() => {
    if (!activity.length) {
      bootstrap().catch(() => undefined);
    } else {
      refreshActivity().catch(() => undefined);
    }
  }, [activity.length, bootstrap, refreshActivity]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.header}> 
        <Text style={[styles.title, { color: theme.colors.text }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Complete history across STRK, BTC, and USDC</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activity.map((txn) => (
          <Card key={txn.id} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { borderColor: theme.colors.border }]}> 
                <Text style={[styles.iconLabel, { color: theme.colors.text }]}>{txn.type.slice(0, 1)}</Text>
              </View>
              <View style={styles.copy}> 
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{txn.type}</Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {fromNow(txn.timestamp)} · {txn.privacy}
                </Text>
              </View>
              <View style={styles.amountBlock}> 
                <Text style={[styles.amount, { color: theme.colors.text }]}>
                  {formatShortCurrency(txn.amount, txn.currency)}
                </Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    gap: 16,
  },
  card: {
    paddingVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  copy: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
});
