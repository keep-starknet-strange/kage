import { Switch, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useUserStore } from '../../stores/useUserStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const themeName = useUserStore((state) => state.theme);
  const setTheme = useUserStore((state) => state.setTheme);
  const paranoidMode = useUserStore((state) => state.paranoidMode);
  const setParanoidMode = useUserStore((state) => state.setParanoidMode);
  const screenshotGuard = usePrivacyStore((state) => state.screenshotGuard);
  const setScreenshotGuard = usePrivacyStore((state) => state.setScreenshotGuard);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
        <Row label={`${themeName === 'dark' ? 'Dark' : 'Light'} Theme`}>
          <Switch
            value={themeName === 'dark'}
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
            thumbColor={themeName === 'dark' ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          />
        </Row>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy</Text>
        <Row label="Paranoid Mode">
          <Switch
            value={paranoidMode}
            onValueChange={(val) => setParanoidMode(val)}
            thumbColor={paranoidMode ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          />
        </Row>
        <Row label="Screenshot Guard">
          <Switch
            value={screenshotGuard}
            onValueChange={(val) => setScreenshotGuard(val)}
            thumbColor={screenshotGuard ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          />
        </Row>
      </View>
    </View>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});
