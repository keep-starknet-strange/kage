import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { formatShortCurrency } from '../../utils/format';
import { fromNow } from '../../utils/time';

export default function ActivityScreen() {
  const theme = useTheme();
  const { activity, refreshActivity, bootstrap } = useWalletStore((state) => ({
    activity: state.activity,
    refreshActivity: state.refreshActivity,
    bootstrap: state.bootstrap,
  }));

  useEffect(() => {
    if (!activity.length) {
      bootstrap().catch(() => undefined);
    } else {
      refreshActivity().catch(() => undefined);
    }
  }, [activity.length, bootstrap, refreshActivity]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activity.map((txn) => (
          <Card key={txn.id} style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>{txn.type}</Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: txn.privacy === 'PRIVATE' ? theme.colors.accent : theme.colors.textSecondary },
                  ]}
                >
                  {txn.privacy}
                </Text>
              </View>
              <View style={styles.amountBlock}>
                <Text style={[styles.amount, { color: theme.colors.text }]}>
                  {formatShortCurrency(txn.amount, txn.currency)}
                </Text>
                <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>{fromNow(txn.timestamp)}</Text>
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
  content: {
    padding: 24,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
