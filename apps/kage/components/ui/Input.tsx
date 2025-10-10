import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

export const Input = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const theme = useTheme();

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.colors.textMuted}
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
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
});
