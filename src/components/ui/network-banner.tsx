import { spaceTokens } from "@/design/tokens";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NetworkBannerProps {
    network: NetworkDerfinition | null;
}

export default function NetworkBanner({ network }: NetworkBannerProps) {
    const appInsets = useSafeAreaInsets();
    const { setAdditionalInsets } = useDynamicSafeAreaInsets();
    const { colors: colorTokens } = useTheme();

    const [bannerHeight, setBannerHeight] = useState(0);

    useEffect(() => {
        setAdditionalInsets({
            top: bannerHeight,
            right: 0,
            bottom: 0,
            left: 0,
        });
    }, [bannerHeight, setAdditionalInsets]);

    useEffect(() => {
        if (!network?.isTestNetwork) {
            setBannerHeight(0);
        }
    }, [network?.isTestNetwork, setBannerHeight]);

    const networkDisplayName = useMemo(() => {
        if (!network?.isTestNetwork) return '';

        switch (network.chainId) {
            case 'SN_SEPOLIA':
                return 'Sepolia';
            default:
                return network.chainId;
        }
    }, [network]);

    const networkBanner = network?.isTestNetwork && (
        <View
            style={{
                flex: 1,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                paddingTop: appInsets.top,
                backgroundColor: colorTokens['status.warning'],
            }}
        >
            <View
                style={{ alignItems: "center", paddingVertical: spaceTokens[0] }}
                onLayout={(event) => {
                    setBannerHeight(event.nativeEvent.layout.height);
                }}
            >
                <Text style={{ color: colorTokens['text.inverted'] }}>{`Test Network ${networkDisplayName}`}</Text>
            </View>
        </View>
    ) || null;

    // <StatusBar style="auto" />
    return (
        <>
            {networkBanner}
            <StatusBar style="auto" />
        </>
    );
}