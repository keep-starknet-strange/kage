import { MagnifyingGlass, EyeSlash } from 'phosphor-react-native';
import { Pressable } from 'react-native';
import { Text, XStack, useTheme } from 'tamagui';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { vibrateSelection } from '../../utils/haptics';
import { PrivateToggle } from './PrivateToggle';

interface AppHeaderProps {
  title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
  const quickHide = usePrivacyStore((state) => state.quickHide);
  const theme = useTheme();
  const secondary = theme?.colorSecondary?.val ?? '#A6B3B8';

  const handleQuickHide = () => {
    vibrateSelection();
    quickHide();
  };

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$md"
      paddingVertical="$sm"
      height={56}
      backgroundColor="$background"
    >
      <Text fontSize={20} fontFamily="Inter_600SemiBold">
        {title}
      </Text>
      <XStack alignItems="center" gap="$md">
        <PrivateToggle />
        <Pressable accessibilityLabel="Search" accessibilityRole="button">
          <MagnifyingGlass size={24} color={secondary} weight='duotone' />
        </Pressable>
        <Pressable onPress={handleQuickHide} accessibilityLabel="Quick hide" accessibilityRole="button">
          <EyeSlash size={24} color={secondary} weight='duotone' />
        </Pressable>
      </XStack>
    </XStack>
  );
};
