import { Tabs } from 'expo-router';
import { GearSix, HouseSimple, List } from 'phosphor-react-native';
import { useTheme } from 'styled-components/native';

const iconSize = 24;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.2,
          fontFamily: 'Inter_500Medium',
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HouseSimple size={iconSize} color={color} weight="fill" />,
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
        name="settings"
        options={{
          title: 'Controls',
          tabBarIcon: ({ color }) => <GearSix size={iconSize} color={color} weight="duotone" />,
        }}
      />
    </Tabs>
  );
}
