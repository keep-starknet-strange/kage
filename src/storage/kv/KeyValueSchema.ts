import { AccountAddress } from "@/profile/account";

export interface KeyValueSchema {
    'device.passphrase.set': boolean;
    'device.biometrics.enabled': boolean;
    'accounts.classHashes': { [key: AccountAddress]: string };
}