import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'styled-components/native';

export default function ProofScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Proof Builder</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Proof animation states will be rendered here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
