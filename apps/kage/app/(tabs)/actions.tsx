import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from 'styled-components/native';

import { Button } from '../../components/ui/Button';

const ACTIONS = [
  { title: 'Send', href: '/send' },
  { title: 'Receive', href: '/receive' },
  { title: 'Swap', href: '/swap' },
  { title: 'Shielded Pools', href: '/shielded' },
  { title: 'Viewing Keys', href: '/keys' },
];

export default function ActionsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Quick Actions</Text>
        {ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} asChild>
            <Button style={styles.button}>{action.title}</Button>
          </Link>
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
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
});
