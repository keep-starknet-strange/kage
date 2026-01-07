import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";

export type AndroidIconMapping = | { source: 'material'; name: ComponentProps<typeof MaterialIcons>['name'] }
    | { source: 'material-community'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

export type IOSIconMapping = SymbolViewProps['name'];

/**
 * Platform-specific icon configuration
 * - ios: SF Symbol name
 * - android: Material Icon or Material Community Icon name with source
 */
export type PlatformIconMapping = {
    ios: IOSIconMapping;
    android: AndroidIconMapping
};

/**
 * Icon mapping type where you can define custom icon names that map to platform-specific icons
 * 
 * @example
 * const myIcons = {
 *   wallet: {
 *     ios: 'wallet.bifold.fill',
 *     android: { source: 'material-community', name: 'wallet-bifold' }
 *   },
 *   settings: {
 *     ios: 'gearshape.fill',
 *     android: { source: 'material', name: 'settings' }
 *   }
 * } satisfies IconMapping;
 */
export type IconMapping = Record<string, PlatformIconMapping>;

const MAPPING = {
    'chevron-right': {
        ios: 'chevron.right',
        android: { source: 'material-community', name: 'chevron-right' }
    },
    'wallet': {
        ios: 'wallet.bifold.fill',
        android: { source: 'material-community', name: 'wallet-bifold' }
    },
    'shield': {
        ios: 'shield.fill',
        android: { source: 'material-community', name: 'shield' }
    },
    'trash': {
        ios: 'trash.fill',
        android: { source: 'material-community', name: 'delete' }
    },
    'checkmark': {
        ios: 'checkmark',
        android: { source: 'material-community', name: 'check' }
    },
    'checkmark-circle': {
        ios: 'checkmark.circle.fill',
        android: { source: 'material-community', name: 'check-circle' }
    },
    'settings': {
        ios: 'gearshape.fill',
        android: { source: 'material', name: 'settings' }
    },
    'plus-circle': {
        ios: 'plus.circle.fill',
        android: { source: 'material-community', name: 'plus-circle' }
    },
    'arrow-right-circle': {
        ios: 'arrow.right.circle.fill',
        android: { source: 'material-community', name: 'arrow-right-circle' }
    },
    'shield-off': {
        ios: 'shield.slash.fill',
        android: { source: 'material-community', name: 'shield-off' }
    },
    'upload-circle': {
        ios: 'square.and.arrow.up.circle.fill',
        android: { source: 'material-community', name: 'upload-circle' }
    },
    'lock': {
        ios: 'lock.fill',
        android: { source: 'material-community', name: 'lock' }
    },
    'lock-open': {
        ios: 'lock.open.fill',
        android: { source: 'material-community', name: 'lock-open' }
    },
    'lock-shield': {
        ios: 'lock.shield.fill',
        android: { source: 'material-community', name: 'shield' }
    },
    'copy': {
        ios: 'document.on.document',
        android: { source: 'material-community', name: 'content-copy' }
    },
    'link': {
        ios: 'link',
        android: { source: 'material-community', name: 'link-variant' }
    },
    'pencil': {
        ios: 'pencil',
        android: { source: 'material-community', name: 'pencil' }
    },
    'ellipsis': {
        ios: 'ellipsis',
        android: { source: 'material-community', name: 'dots-horizontal' }
    },
    'alert-circle': {
        ios: 'exclamationmark.circle.fill',
        android: { source: 'material-community', name: 'alert-circle' }
    },
    'send': {
        ios: 'paperplane',
        android: { source: 'material-community', name: 'send' }
    },
    'swap': {
        ios: 'arrow.left.arrow.right.circle.fill',
        android: { source: 'material', name: 'swap-horizontal-circle' }
    },
    'face-id': {
        ios: 'faceid',
        android: { source: 'material-community', name: 'face-recognition' }
    },
    'touch-id': {
        ios: 'touchid',
        android: { source: 'material-community', name: 'fingerprint' }
    },
    'optic-id': {
        ios: 'opticid',
        android: { source: 'material-community', name: 'eye-circle-outline' }
    },
    'eye': {
        ios: 'eye.fill',
        android: { source: 'material-community', name: 'eye' }
    },
    'eye-off': {
        ios: 'eye.slash.fill',
        android: { source: 'material-community', name: 'eye-off' }
    },
    'key': {
        ios: 'key.fill',
        android: { source: 'material-community', name: 'key' }
    },
    'cash-lock': {
        ios: 'bolt.shield.fill',
        android: { source: 'material-community', name: 'cash-lock' }
    },
    'currency': {
        ios: 'centsign.circle',
        android: { source: 'material-community', name: 'alpha-c-circle-outline' }
    },
    'cloud': {
        ios: 'icloud',
        android: { source: 'material-community', name: 'cloud-outline' }
    },
    'network': {
        ios: 'network',
        android: { source: 'material-community', name: 'network' }
    },
    'network-off': {
        ios: 'network.slash',
        android: { source: 'material-community', name: 'network-off' }
    },
    'globe': {
        ios: 'globe',
        android: { source: 'material-community', name: 'earth' }
    },
    'wrench': {
        ios: 'wrench.and.screwdriver',
        android: { source: 'material-community', name: 'wrench' }
    },
    'server': {
        ios: 'server.rack',
        android: { source: 'material-community', name: 'server' }
    },
    'web': {
        ios: 'safari',
        android: { source: 'material-community', name: 'web' }
    },
    'chevron-down': {
        ios: 'chevron.down',
        android: { source: 'material-community', name: 'chevron-down' }
    },
    'person': {
        ios: 'person.fill',
        android: { source: 'material-community', name: 'account' }
    },
    'person-circle': {
        ios: 'person.crop.circle.fill',
        android: { source: 'material-community', name: 'account-circle' }
    },
    'key-alert': {
        ios: 'key.slash',
        android: { source: 'material-community', name: 'key-alert' }
    },
    'chevron-left': {
        ios: 'chevron.left',
        android: { source: 'material-community', name: 'arrow-left' }
    },
    'close': {
        ios: 'xmark',
        android: { source: 'material-community', name: 'close' }
    },
    'tray': {
        ios: 'tray',
        android: { source: 'material-community', name: 'tray' }
    },
    'external-link': {
        ios: 'arrow.up.right.square',
        android: { source: 'material-community', name: 'open-in-new' }
    },
    'search': {
        ios: 'magnifyingglass',
        android: { source: 'material-community', name: 'magnify' }
    },
} satisfies IconMapping;

export function sfSymbol(name: IconSymbolName): IOSIconMapping {
    return MAPPING[name].ios;
}

export function androidSymbol(name: IconSymbolName): AndroidIconMapping {
    return MAPPING[name].android;
}

export type IconSymbolName = keyof typeof MAPPING;