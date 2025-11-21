import { SymbolView, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';
import { IconSymbolName, sfSymbol } from './icon-symbol';
import { useMemo } from 'react';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const sfSymbolName = useMemo(() => sfSymbol(name), [name, sfSymbol]);
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={sfSymbolName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
