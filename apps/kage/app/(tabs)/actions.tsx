import { ScrollView, Text, YStack, Button } from 'tamagui';
import { Link } from 'expo-router';

const actions = [
  { title: 'Send', href: '/send' },
  { title: 'Receive', href: '/receive' },
  { title: 'Swap', href: '/swap' },
  { title: 'Shielded Pools', href: '/shielded' },
  { title: 'Viewing Keys', href: '/keys' },
];

export default function ActionsScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text fontSize={20} fontWeight="600">
          Quick Actions
        </Text>
        {actions.map((action) => (
          <Link key={action.title} href={action.href} asChild>
            <Button
              size="$5"
              borderRadius="$lg"
              backgroundColor="$accent"
              color="$background"
            >
              {action.title}
            </Button>
          </Link>
        ))}
      </ScrollView>
    </YStack>
  );
}
