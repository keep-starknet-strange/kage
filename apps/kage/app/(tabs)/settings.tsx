import { Switch, Text, XStack, YStack } from 'tamagui';

import { usePrivacyStore } from '../../stores/usePrivacyStore';
import { useUserStore } from '../../stores/useUserStore';

export default function SettingsScreen() {
  const theme = useUserStore((state) => state.theme);
  const setTheme = useUserStore((state) => state.setTheme);
  const paranoidMode = useUserStore((state) => state.paranoidMode);
  const setParanoidMode = useUserStore((state) => state.setParanoidMode);
  const screenshotGuard = usePrivacyStore((state) => state.screenshotGuard);
  const setScreenshotGuard = usePrivacyStore((state) => state.setScreenshotGuard);

  return (
    <YStack flex={1} backgroundColor="$background" padding="$xl" space="$lg">
      <YStack space="$md">
        <Text fontSize={20} fontWeight="600">
          Appearance
        </Text>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16}>{theme === 'dark' ? 'Dark' : 'Light'} Theme</Text>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(val) => setTheme(val ? 'dark' : 'light')}
            size="$3"
          >
            <Switch.Thumb backgroundColor="$accent" />
          </Switch>
        </XStack>
      </YStack>
      <YStack space="$md">
        <Text fontSize={20} fontWeight="600">
          Privacy
        </Text>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16}>Paranoid Mode</Text>
          <Switch
            checked={paranoidMode}
            onCheckedChange={(val) => setParanoidMode(!!val)}
            size="$3"
          >
            <Switch.Thumb backgroundColor="$accent" />
          </Switch>
        </XStack>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16}>Screenshot Guard</Text>
          <Switch
            checked={screenshotGuard}
            onCheckedChange={(val) => setScreenshotGuard(!!val)}
            size="$3"
          >
            <Switch.Thumb backgroundColor="$accent" />
          </Switch>
        </XStack>
      </YStack>
    </YStack>
  );
}
