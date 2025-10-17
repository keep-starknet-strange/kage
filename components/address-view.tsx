import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useEffect, useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard'

export type AddressViewProps = {
    address: string;
}

export function AddressView({ address }: AddressViewProps) {
    const [displayedAddress, setDisplayedAddress] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const parts = [];
        if (address.length > 10) {
            parts.push(address.substring(0, 5));
            parts.push(address.substring(address.length - 6, address.length));
        }

        setDisplayedAddress(parts.join("..."));
    }, [address, setDisplayedAddress]);

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{displayedAddress}</Text>

            <TouchableOpacity
                disabled={isCopied}
                onPress={() => {
                    void copyToClipboard(address)
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1500);
                }}
            >
                <Ionicons name={isCopied ? "checkmark" : "copy-outline"} size={24} color={styles.text.color} />
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#a19f9f",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 8,
    },
    text: {
        color: "white",
    }
})
