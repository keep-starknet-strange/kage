// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {SymbolWeight, SymbolViewProps} from 'expo-symbols';
import {ComponentProps} from 'react';
import {OpaqueColorValue, type StyleProp, type TextStyle} from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
    'house.fill': 'home',
    'paperplane.fill': 'send',
    'chevron.left.forwardslash.chevron.right': 'code',
    'chevron.right': 'chevron-right',
    'wallet.bifold.fill': 'account-balance-wallet',
    'shield.fill': 'privacy-tip',
    'trash.fill': 'delete',
    'key': 'shield',
    'checkmark': 'check',
    'checkmark.circle.fill': 'check-circle',
    'gearshape.fill': 'settings',
    'plus.circle.fill': 'add-circle',
    'plus.circle': 'add-circle-outline',
    'arrow.right.circle.fill': 'arrow-circle-right',
    'arrow.down.circle.fill': 'arrow-circle-down',
    'arrow.up.circle.fill': 'arrow-circle-up',
    'arrow.up.circle': 'arrow-circle-up',
    'lock.fill': 'lock',
    'lock.open.fill': 'lock-open',
    'lock.shield.fill': 'shield',
    'document.on.document': 'content-copy',
    'arrow.up.right.square': 'output',
    'pencil': 'edit',
    'pencil.circle.fill': 'edit',
    'ellipsis': 'more-horiz',
    'ellipsis.circle': 'more-horiz',
    'exclamationmark.circle.fill': 'error',
    'paperplane': 'send',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
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
    return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style}/>;
}
