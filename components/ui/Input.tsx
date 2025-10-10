import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

export const Input = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const theme = useTheme();

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.colors.textMuted}
      selectionColor={theme.colors.accent}
      style={[
        styles.base,
        {
          borderColor: theme.colors.border,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        props.style,
      ]}
      {...props}
    />
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.25,
    paddingHorizontal: 18,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
});
