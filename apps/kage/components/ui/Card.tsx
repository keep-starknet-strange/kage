import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';

export interface CardProps extends ViewProps {
  children: ReactNode;
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, glass, style, ...props }: CardProps) => {
  const theme = useTheme();
  const backgroundColor = glass ? theme.colors.glass : theme.colors.surfaceElevated;

  return (
    <View
      style={[styles.base, { backgroundColor, borderColor: theme.colors.border }, style as StyleProp<ViewStyle>]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 0,
  },
});
