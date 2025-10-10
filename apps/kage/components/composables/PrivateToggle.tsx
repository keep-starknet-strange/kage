import { MotiView } from 'moti';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { vibrateSelection } from '../../utils/haptics';

interface PrivateToggleProps {
  showLabel?: boolean;
}

export const PrivateToggle = ({ showLabel = false }: PrivateToggleProps) => {
  const privateMode = usePrivacyStore((state) => state.privateMode);
  const toggle = usePrivacyStore((state) => state.togglePrivateMode);

  const handlePress = () => {
    vibrateSelection();
    toggle();
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="switch" accessibilityState={{ checked: privateMode }}>
      <XStack
        width={64}
        height={34}
        borderRadius="$pill"
        backgroundColor={privateMode ? '$accent' : '$borderStrong'}
        alignItems="center"
        paddingHorizontal="$xs"
      >
        <MotiView
          animate={{ translateX: privateMode ? 28 : 0 }}
          transition={{ type: 'timing', duration: 180 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: privateMode ? '#0B0F10' : '#FFFFFF',
          }}
        />
      </XStack>
      {showLabel && (
        <Text marginTop="$xs" fontSize={12} color="$colorSecondary" textAlign="center">
          {privateMode ? 'Private' : 'Public'}
        </Text>
      )}
    </Pressable>
  );
};
