import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { vibrateSelection } from '../../utils/haptics';

interface PrivateToggleProps {
  showLabel?: boolean;
}

export const PrivateToggle = ({ showLabel = false }: PrivateToggleProps) => {
  const theme = useTheme();
  const privateMode = usePrivacyStore((state) => state.privateMode);
  const toggle = usePrivacyStore((state) => state.togglePrivateMode);

  const handlePress = () => {
    vibrateSelection();
    toggle();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: privateMode }}
        onPress={handlePress}
        style={[styles.track, { backgroundColor: privateMode ? theme.colors.accent : theme.colors.surfaceElevated, borderColor: privateMode ? theme.colors.accent : theme.colors.border }]}
      >
        <MotiView
          animate={{ translateX: privateMode ? 30 : 0 }}
          transition={{ type: 'timing', duration: 180 }}
          style={[
            styles.thumb,
            { backgroundColor: privateMode ? theme.colors.background : '#FFFFFF' },
          ]}
        />
      </Pressable>
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {privateMode ? 'Private' : 'Public'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  track: {
    width: 64,
    height: 34,
    borderRadius: 17,
    padding: 3,
    justifyContent: 'center',
    borderWidth: 1,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
    textAlign: 'center',
  },
});
