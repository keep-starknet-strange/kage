import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleProp, Text, TextInput, TouchableOpacity, View, ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface SeedPhraseInputProps {
  onSeedPhraseChange: (words: SeedPhraseWords | null) => void;
  wordCount?: 12 | 24;
  style?: StyleProp<ViewStyle>;
}

export const SeedPhraseInput = ({ 
  onSeedPhraseChange, 
  wordCount = 24, 
  style 
}: SeedPhraseInputProps) => {
  const [words, setWords] = useState<string[]>(Array(wordCount).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const disabledRef = useRef(false);

  const styles = useThemedStyle(themedStyleSheet);
  const { colors: colorTokens } = useTheme();

  useEffect(() => {
    try {
      const seedPhraseWords = new SeedPhraseWords(words);
      onSeedPhraseChange(seedPhraseWords);
    } catch (error) {
      onSeedPhraseChange(null);
    }
  }, [words, onSeedPhraseChange]);

  const handleWordChange = (index: number, value: string) => {
    if (disabledRef.current) return;

    // Check if the value contains multiple words (paste detection)
    const trimmedValue = value.trim();

    // Normal single word input
    const newWords = [...words];
    const cleanValue = trimmedValue.toLowerCase();
    newWords[index] = cleanValue;
    setWords(newWords);
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && words[index] === '' && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitEditing = (index: number) => {
    if (index < wordCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const isWordValid = (word: string): boolean => {
    return word === '' || wordlist.includes(word);
  };

  const clearAll = () => {
    setWords(Array(wordCount).fill(''));
    inputRefs.current[0]?.focus();
  };

  const paste = async () => {
    try {
      const text = (await Clipboard.getStringAsync()).trim().toLowerCase();

      const words = SeedPhraseWords.fromMnemonic(text);
      disabledRef.current = true;
      setWords(words.getWords())  
      
      setTimeout(() => {
        disabledRef.current = false;
      }, 500);
    } catch (error) {
      // Do nothing
    }
  }

  const filledWordsCount = words.filter(w => w.length > 0).length;

  return (
    <View style={[styles.container, style]}>
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Recovery Phrase</Text>
          <Text style={styles.headerSubtitle}>
            {filledWordsCount}/{wordCount} words entered
          </Text>
        </View>
        {filledWordsCount > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {filledWordsCount === 0 && (
          <TouchableOpacity onPress={paste} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Paste</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Words Grid */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.gridContainer}
        keyboardShouldPersistTaps="handled"
        bottomOffset={50}
      >
        {words.map((word, index) => {
          const isValid = isWordValid(word);
          const isFocused = focusedIndex === index;

          return (
            <View key={index} style={styles.wordContainer}>
              <View style={styles.wordNumberContainer}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
              </View>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.wordInput,
                  isFocused && styles.wordInputFocused,
                  !isValid && word.length > 0 && styles.wordInputError,
                  word.length > 0 && isValid && styles.wordInputValid,
                ]}
                value={word}
                onChangeText={(value) => handleWordChange(index, value)}
                editable={!disabledRef.current}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => {
                  setFocusedIndex(null);
                }}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                onSubmitEditing={() => handleSubmitEditing(index)}
                placeholder={`Word ${index + 1}`}
                placeholderTextColor={colorTokens['text.muted']}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType={index === wordCount - 1 ? 'done' : 'next'}
                blurOnSubmit={index === wordCount - 1}
              />
              {word.length > 0 && (
                <View style={styles.wordStatus}>
                  {isValid ? (
                    <IconSymbol
                      name="checkmark-circle"
                      size={16}
                      color={colorTokens['status.success']}
                    />
                  ) : (
                    <IconSymbol
                      name="alert-circle"
                      size={16}
                      color={colorTokens['status.error']}
                    />
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* This is a hack to ensure that the last row aligns correctly */}
        <View style={[styles.wordContainer, {opacity: 0}]}/>
      </KeyboardAwareScrollView>
    </View>
  );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spaceTokens[3],
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    ...fontStyles.ubuntuMono.bold,
    color: colorTokens['text.primary'],
    marginBottom: spaceTokens[1],
  },
  headerSubtitle: {
    fontSize: 14,
    ...fontStyles.ubuntuMono.regular,
    color: colorTokens['text.secondary'],
  },
  clearButton: {
    paddingHorizontal: spaceTokens[3],
    paddingVertical: spaceTokens[2],
    backgroundColor: colorTokens['bg.elevated'],
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: colorTokens['border.subtle'],
  },
  clearButtonText: {
    fontSize: 14,
    ...fontStyles.ubuntuMono.semibold,
    color: colorTokens['status.error'],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spaceTokens[2],
  },
  wordContainer: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorTokens['bg.elevated'],
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: colorTokens['border.subtle'],
    paddingHorizontal: spaceTokens[1],
    height: 48,
  },
  wordNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spaceTokens[0],
  },
  wordNumber: {
    fontSize: 12,
    ...fontStyles.ubuntuMono.semibold,
    color: colorTokens['text.muted'],
  },
  wordInput: {
    flex: 1,
    fontSize: 15,
    ...fontStyles.ubuntuMono.regular,
    color: colorTokens['text.primary'],
    paddingVertical: spaceTokens[3],
  },
  wordInputFocused: {
    color: colorTokens['brand.accent'],
  },
  wordInputError: {
    color: colorTokens['status.error'],
  },
  wordInputValid: {
    color: colorTokens['status.success'],
  },
  wordStatus: {
    marginLeft: spaceTokens[1],
  },
}));

