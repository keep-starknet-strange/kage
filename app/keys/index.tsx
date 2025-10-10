import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from 'styled-components/native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { fromNow } from '../../utils/time';

export default function KeysScreen() {
  const theme = useTheme();
  const viewingKeys = useWalletStore((state) => state.viewingKeys);
  const bootstrap = useWalletStore((state) => state.bootstrap);

  useEffect(() => {
    if (!viewingKeys.length) {
      bootstrap().catch(() => undefined);
    }
  }, [viewingKeys.length, bootstrap]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Viewing Keys</Text>
          <Link href="/keys/grant" asChild>
            <Button variant="secondary">Grant</Button>
          </Link>
        </View>
        {viewingKeys.map((key) => (
          <Card key={key.id} style={styles.card}>
            <Text style={[styles.keyLabel, { color: theme.colors.text }]}>{key.label}</Text>
            <Text style={[styles.keyMeta, { color: theme.colors.textMuted }]}>Issued {fromNow(key.createdAt)}</Text>
            {key.lastAccessAt && (
              <Text style={[styles.keyMeta, { color: theme.colors.textSecondary }]}>Last accessed {fromNow(key.lastAccessAt)}</Text>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    marginBottom: 12,
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  keyMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
