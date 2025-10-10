import { useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield } from 'phosphor-react-native';
import { useTheme } from 'styled-components/native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useUserStore } from '../../stores/useUserStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { generateMnemonicPreview } from '../../utils/mnemonic';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const paranoidMode = useUserStore((state) => state.paranoidMode);
  const setParanoidMode = useUserStore((state) => state.setParanoidMode);
  const biometricsEnabled = useUserStore((state) => state.biometricsEnabled);
  const setBiometricsEnabled = useUserStore((state) => state.setBiometricsEnabled);
  const setScreenshotGuard = usePrivacyStore((state) => state.setScreenshotGuard);
  const setQuickHideEnabled = usePrivacyStore((state) => state.setQuickHideEnabled);
  const mnemonicPreview = useWalletStore((state) => state.mnemonicPreview);
  const setMnemonicPreview = useWalletStore((state) => state.setMnemonicPreview);
  const hasPasscode = useAuthStore((state) => state.hasPasscode);

  useEffect(() => {
    if (!mnemonicPreview.length) {
      setMnemonicPreview(generateMnemonicPreview());
    }
  }, [mnemonicPreview.length, setMnemonicPreview]);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((supported) => {
        if (!supported) {
          setBiometricsEnabled(false);
        }
      })
      .catch(() => setBiometricsEnabled(false));
  }, [setBiometricsEnabled]);

  useEffect(() => {
    setScreenshotGuard(paranoidMode);
    setQuickHideEnabled(true);
  }, [paranoidMode, setQuickHideEnabled, setScreenshotGuard]);

  const handleContinue = () => {
    router.push({ pathname: '/auth/passcode', params: { phase: hasPasscode ? 'verify' : 'setup' } });
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.hero}>
        <Shield size={48} color={theme.colors.accent} weight="duotone" />
        <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Privacy is STARK Normal</Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>Mocked experience for demos — no real funds move.</Text>
      </View>

      <Card style={styles.mnemonicCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>12-word preview</Text>
        <View style={styles.mnemonicGrid}>
          {mnemonicPreview.map((word, index) => (
            <View key={`${word}-${index}`} style={[styles.mnemonicItem, { backgroundColor: theme.colors.surfaceElevated }]}> 
              <Text style={[styles.mnemonicText, { color: theme.colors.textSecondary }]}>
                {index + 1}. {word}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.section}>
        <SettingRow
          title="Paranoid Mode"
          description="Auto-lock 15s, block screenshots, obfuscate balances."
          value={paranoidMode}
          onValueChange={(val) => setParanoidMode(val)}
        />
        <SettingRow
          title="Biometrics unlock"
          description="Face ID / Touch ID after passcode."
          value={biometricsEnabled}
          onValueChange={(val) => setBiometricsEnabled(val)}
        />
      </View>

      <Button onPress={handleContinue}>Continue</Button>
    </ScrollView>
  );
}

const SettingRow = ({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.accent : '#FFFFFF'}
        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  mnemonicCard: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mnemonicItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  mnemonicText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingCopy: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
