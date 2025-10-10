import { useEffect } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { useWalletStore } from '../../stores/useWalletStore';
import { maskAddress } from '../../utils/format';

export default function ContactsScreen() {
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
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text fontSize={20} fontWeight="600">
          Contacts
        </Text>
        {contacts.map((contact) => (
          <XStack
            key={contact.id}
            justifyContent="space-between"
            alignItems="center"
            padding="$md"
            borderRadius="$md"
            backgroundColor="$surfaceElevated"
          >
            <YStack>
              <Text fontSize={16} fontWeight="600">
                {contact.name}
              </Text>
              <Text fontSize={13} color="$colorMuted">
                {contact.alias}
              </Text>
            </YStack>
            <Text fontFamily="JetBrainsMono_500Medium" fontSize={12} color="$colorSecondary">
              {maskAddress(contact.address)}
            </Text>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
