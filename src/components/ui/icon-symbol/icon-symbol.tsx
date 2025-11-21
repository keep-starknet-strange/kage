// Fallback for using MaterialIcons on Android and web.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { androidSymbol, IconSymbolName } from './mapping';


/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on custom icon names that map to platform-specific icons.
 */
export function IconSymbol({
    name,
    size = 24,
    color,
    style,
}: {
    name: IconSymbolName;
    size?: number;
    color: string | OpaqueColorValue;
    style?: StyleProp<TextStyle>;
    weight?: SymbolWeight;
}) {
    const iconConfig = androidSymbol(name);
    if (iconConfig.source === 'material-community') {
        return <MaterialCommunityIcons color={color} size={size} name={iconConfig.name} style={style} />;
    } else if (iconConfig.source === 'material') {
        return <MaterialIcons color={color} size={size} name={iconConfig.name} style={style} />;
    }
}