import { NetworkId } from "@/profile/misc";

export function isPrivateTransferEnabled(): boolean {
    console.log("isPrivateTransferEnabled", process.env.EXPO_PUBLIC_PRIVATE_TRANSFERS_ENABLED);
    return process.env.EXPO_PUBLIC_PRIVATE_TRANSFERS_ENABLED === 'true';
}

export function isSwapEnabled(): boolean {
    return !isPrivateTransferEnabled();
}

export function availableNetworks(): NetworkId[] {
    if (isPrivateTransferEnabled()) {
        return ["SN_SEPOLIA"];
    } else if (isSwapEnabled()) {
        return ["SN_MAIN", "SN_SEPOLIA"];
    } else {
        return ["SN_MAIN", "SN_SEPOLIA"];
    }
}