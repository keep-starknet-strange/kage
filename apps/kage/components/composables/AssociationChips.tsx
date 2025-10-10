import { Text, XStack, YStack } from 'tamagui';

import { ASSOCIATION_PRESETS } from '../../domain/constants';
import { AssocSet } from '../../domain/models';
import { Chip } from '../ui/Chip';

interface AssociationChipsProps {
  selected: AssocSet;
  onSelect: (id: AssocSet) => void;
}

export const AssociationChips = ({ selected, onSelect }: AssociationChipsProps) => (
  <YStack gap="$sm">
    <Text fontSize={15} fontFamily="Inter_600SemiBold">
      Association set
    </Text>
    <XStack gap="$sm" flexWrap="wrap">
      {ASSOCIATION_PRESETS.map((preset) => (
        <Chip
          key={preset.id}
          label={preset.title}
          selected={selected === preset.id}
          onPress={() => onSelect(preset.id)}
        />
      ))}
    </XStack>
    <Text fontSize={13} color="$colorMuted">
      {ASSOCIATION_PRESETS.find((preset) => preset.id === selected)?.description}
    </Text>
  </YStack>
);
