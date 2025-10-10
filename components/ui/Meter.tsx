import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

interface MeterProps {
  label: string;
  value: number; // 0-1
}

export const Meter = ({ label, value }: MeterProps) => {
  const theme = useTheme();
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.glass }]}> 
      <View style={[styles.track, { backgroundColor: theme.colors.accentGlow }]}> 
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ type: 'timing', duration: 240 }}
          style={[styles.fill, { backgroundColor: theme.colors.accent }]}
        />
      </View>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  fill: {
    height: '100%',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
