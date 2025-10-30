import { colorTokens, radiusTokens, spaceTokens } from '@/design/tokens';
import { ProfileState } from '@/profile/profileState';
import { useProfileStore } from '@/stores/profileStore';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export type NetworkBadgeProps = {
    style?: ViewStyle;
    onPress?: () => void;
};

export function NetworkBadge({ style, onPress }: NetworkBadgeProps) {
    const { profileState } = useProfileStore();
    
    const network = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) return null;
        return profileState.settings.networks.currentNetworkDefinition;
    }, [profileState]);

    // Format network name for display
    const networkDisplayName = useMemo(() => {
        if (!network) return 'No Network';
        switch (network.chainId) {
            case 'SN_MAIN':
                return 'Mainnet';
            case 'SN_SEPOLIA':
                return 'Sepolia';
            default:
                return network.chainId;
        }
    }, [network]);

    const BadgeContent = () => (
        <>
            <View style={[
                styles.networkIndicator,
                network?.chainId === 'SN_MAIN' && styles.networkIndicatorMainnet,
                network?.chainId === 'SN_SEPOLIA' && styles.networkIndicatorSepolia,
            ]} />
            <Text style={styles.networkName}>{networkDisplayName}</Text>
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity 
                style={[styles.networkBadge, style]}
                activeOpacity={0.7}
                onPress={onPress}
            >
                <BadgeContent />
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.networkBadge, style]}>
            <BadgeContent />
        </View>
    );
}

const styles = StyleSheet.create({
    networkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.pill,
        paddingVertical: spaceTokens[1], // 8px
        paddingHorizontal: spaceTokens[3], // 12px
        gap: spaceTokens[1], // 8px
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 1,
    },
    networkIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colorTokens['text.muted'],
    },
    networkIndicatorMainnet: {
        backgroundColor: colorTokens['status.success'],
    },
    networkIndicatorSepolia: {
        backgroundColor: colorTokens['status.warning'],
    },
    networkName: {
        fontSize: 14,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
});

