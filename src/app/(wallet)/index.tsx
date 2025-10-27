import { useAccountStore } from "@/stores/accountStore";
import { ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const {
        starknetAccount,
    } = useAccountStore();
    const insets = useSafeAreaInsets();

    if (starknetAccount) {
        return (
            <ScrollView style={{flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom}}>
                <Text>Accounts</Text>
            </ScrollView>
        );
    }

    return null;
}
