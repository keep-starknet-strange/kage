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
  const backgroundColor = glass ? theme.colors.glass : theme.colors.surface;
  const borderColor = glass ? theme.colors.border : theme.colors.border;
  const borderWidth = glass ? StyleSheet.hairlineWidth : 1;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          borderRadius: theme.radii.lg,
          shadowColor: '#141824',
          shadowOpacity: glass ? 0.08 : 0.12,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 6,
  },
});
