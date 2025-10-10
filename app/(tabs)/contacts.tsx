import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { maskAddress } from '../../utils/format';

export default function ContactsScreen() {
  const theme = useTheme();
  const contacts = useWalletStore((state) => state.contacts);
  const bootstrap = useWalletStore((state) => state.bootstrap);

  useEffect(() => {
    if (!contacts.length) {
      bootstrap().catch(() => undefined);
    }
  }, [contacts.length, bootstrap]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.header}> 
        <Text style={[styles.title, { color: theme.colors.text }]}>Trusted Contacts</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Curate who can receive STRK from you instantly.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {contacts.map((contact) => (
          <Card key={contact.id} style={styles.card}>
            <View style={styles.contactBlock}> 
              <Text style={[styles.contactName, { color: theme.colors.text }]}>{contact.name}</Text>
              <Text style={[styles.contactAlias, { color: theme.colors.textMuted }]}>{contact.alias}</Text>
            </View>
            <Text style={[styles.contactAddress, { color: theme.colors.textSecondary }]}>
              {maskAddress(contact.address)}
            </Text>
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
    paddingBottom: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactBlock: {
    flex: 1,
    marginRight: 16,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  contactAlias: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  contactAddress: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_500Medium',
    maxWidth: '50%',
    textAlign: 'right',
  },
});
