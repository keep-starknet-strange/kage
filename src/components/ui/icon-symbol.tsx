// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {SymbolWeight, SymbolViewProps} from 'expo-symbols';
import {ComponentProps} from 'react';
import {OpaqueColorValue, type StyleProp, type TextStyle} from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialCommunityIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {    
    'chevron.right': 'chevron-right',
    'wallet.bifold.fill': 'wallet-bifold',
    'shield.fill': 'shield',
    'trash.fill': 'delete',
    'checkmark': 'check',
    'checkmark.circle.fill': 'check-circle',
    'gearshape.fill': 'account-settings', // TODO
    'plus.circle': 'plus-circle',
    'arrow.right.circle.fill': 'arrow-right-circle',
    'shield.slash.fill': 'shield-off',
    'square.and.arrow.up.circle.fill': 'upload-circle',
    'lock.fill': 'lock',
    'lock.open.fill': 'lock-open',
    'lock.shield.fill': 'shield',
    'document.on.document': 'content-copy',
    'link': 'link-variant',
    'pencil': 'pencil',
    'ellipsis': 'dots-horizontal',
    'exclamationmark.circle.fill': 'alert-circle',
    'paperplane': 'send',
    'faceid': 'face-recognition',
    'touchid': 'fingerprint',
    'opticid': 'eye-circle-outline',
    'eye.fill': 'eye',
    'eye.slash.fill': 'eye-off',
    'key.fill': 'key',
    'bolt.shield.fill': 'cash-lock',
    'centsign.circle': 'alpha-c-circle-outline'
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
    return <MaterialCommunityIcons color={color} size={size} name={MAPPING[name]} style={style}/>;
}
