import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Card } from '../../components/ui/Card';
import { useWalletStore } from '../../stores/useWalletStore';
import { maskAddress } from '../../utils/format';

export default function ContactsScreen() {
  const theme = useTheme();
  const { contacts, bootstrap } = useWalletStore((state) => ({
    contacts: state.contacts,
    bootstrap: state.bootstrap,
  }));

  useEffect(() => {
    if (!contacts.length) {
      bootstrap().catch(() => undefined);
    }
  }, [contacts.length, bootstrap]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Contacts</Text>
        {contacts.map((contact) => (
          <Card key={contact.id} style={styles.card}>
            <View>
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
  content: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
