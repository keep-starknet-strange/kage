import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useUserStore } from '../../stores/useUserStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const paranoidMode = useUserStore((state) => state.paranoidMode);
  const setParanoidMode = useUserStore((state) => state.setParanoidMode);
  const screenshotGuard = usePrivacyStore((state) => state.screenshotGuard);
  const setScreenshotGuard = usePrivacyStore((state) => state.setScreenshotGuard);
  const quickHideEnabled = usePrivacyStore((state) => state.quickHideEnabled);
  const setQuickHideEnabled = usePrivacyStore((state) => state.setQuickHideEnabled);
  const camouflageEnabled = usePrivacyStore((state) => state.camouflageEnabled);
  const setCamouflageEnabled = usePrivacyStore((state) => state.setCamouflageEnabled);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: theme.colors.text }]}>Controls</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Privacy tuning for payments.</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy defaults</Text>
        <Row label="Paranoid mode">
          <Switch
            value={paranoidMode}
            onValueChange={setParanoidMode}
            thumbColor={paranoidMode ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
          />
        </Row>
        <Row label="Screenshot guard">
          <Switch
            value={screenshotGuard}
            onValueChange={setScreenshotGuard}
            thumbColor={screenshotGuard ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
          />
        </Row>
        <Row label="Quick-hide gesture">
          <Switch
            value={quickHideEnabled}
            onValueChange={setQuickHideEnabled}
            thumbColor={quickHideEnabled ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
          />
        </Row>
        <Row label="Camouflage shake">
          <Switch
            value={camouflageEnabled}
            onValueChange={setCamouflageEnabled}
            thumbColor={camouflageEnabled ? theme.colors.accent : '#FFFFFF'}
            trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
          />
        </Row>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Demo data</Text>
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Reset coming soon.</Text>
      </View>
    </ScrollView>
  );
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => {
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
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 24,
  },
  header: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  helper: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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
