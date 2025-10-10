import { MagnifyingGlass, EyeSlash } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { vibrateSelection } from '../../utils/haptics';
import { PrivateToggle } from './PrivateToggle';

interface AppHeaderProps {
  title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
  const theme = useTheme();
  const quickHide = usePrivacyStore((state) => state.quickHide);

  const handleQuickHide = () => {
    vibrateSelection();
    quickHide();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.actions}>
        <PrivateToggle />
        <Pressable accessibilityLabel="Search" accessibilityRole="button" style={styles.iconButton}>
          <MagnifyingGlass size={24} color={theme.colors.textSecondary} weight="duotone" />
        </Pressable>
        <Pressable
          onPress={handleQuickHide}
          accessibilityLabel="Quick hide"
          accessibilityRole="button"
          style={styles.iconButton}
        >
          <EyeSlash size={24} color={theme.colors.textSecondary} weight="duotone" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
});
