import { Tabs } from 'expo-router';
import { Gear, House, List, ListPlus, Users } from 'phosphor-react-native';
import { useTheme } from 'tamagui';

const iconSize = 24;

export default function TabsLayout() {
  const theme = useTheme();
  const accent = theme?.accent?.val ?? '#4AF0B8';
  const secondary = theme?.colorSecondary?.val ?? '#A6B3B8';
  const surface = theme?.surfaceElevated?.val ?? '#11161A';
  const border = theme?.border?.val ?? '#1A2329';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: secondary,
        tabBarStyle: {
          backgroundColor: surface,
          borderTopColor: border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter_500Medium',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={iconSize} color={color} weight="duotone" />,
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: 'Actions',
          tabBarIcon: ({ color }) => <ListPlus size={iconSize} color={color} weight="duotone" />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <List size={iconSize} color={color} weight="duotone" />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color }) => <Users size={iconSize} color={color} weight="duotone" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Gear size={iconSize} color={color} weight="duotone" />,
        }}
      />
    </Tabs>
  );
}
