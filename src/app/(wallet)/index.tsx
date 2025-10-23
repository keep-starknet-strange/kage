import {ScrollView} from 'react-native';
import {useAccountStore} from "@/stores/accountStore";
import AccountView from "@/components/account-view";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function HomeScreen() {
    const {
        starknetAccount,
    } = useAccountStore();
    const insets = useSafeAreaInsets();

    if (starknetAccount) {
        return (
            <ScrollView style={{flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom}}>
                <AccountView starknetAccount={starknetAccount}/>
            </ScrollView>
        );
    }

    return null;
}
