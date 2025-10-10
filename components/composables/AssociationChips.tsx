import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';

import { ASSOCIATION_PRESETS } from '../../domain/constants';
import { AssocSet } from '../../domain/models';
import { Chip } from '../ui/Chip';

interface AssociationChipsProps {
  selected: AssocSet;
  onSelect: (id: AssocSet) => void;
}

export const AssociationChips = ({ selected, onSelect }: AssociationChipsProps) => {
  const theme = useTheme();
  const activePreset = ASSOCIATION_PRESETS.find((preset) => preset.id === selected);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Association set</Text>
      <View style={styles.row}>
        {ASSOCIATION_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.title}
            selected={selected === preset.id}
            onPress={() => onSelect(preset.id)}
            style={styles.chip}
          />
        ))}
      </View>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>
        {activePreset?.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
