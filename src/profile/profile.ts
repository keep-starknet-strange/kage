import { Type } from "class-transformer";
import Header from "./header";
import KeySource from "./keys/keySource";
import Network from "./network";
import Settings from "./settings/settings";
import keyframes from "react-native-reanimated/lib/typescript/css/stylesheet/keyframes";

export default class Profile {
    @Type(() => Header)
    readonly header: Header;

    @Type(() => KeySource)
    readonly keySources: readonly KeySource[];

    @Type(() => Network)
    readonly networks: readonly Network[];

    @Type(() => Settings)
    readonly settings: Settings;

    constructor(
        header: Header,
        keySources: KeySource[],
        networks: Network[],
        settings: Settings
    ) {
        this.header = header;
        this.keySources = keySources;
        this.networks = networks;
        this.settings = settings;
    }

    static createFromSeedPhrase(
        seedPhraseWords: string[]
    ) {
        const hdKeySource = KeySource.fromSeedPhrase(seedPhraseWords);
        const header = Header.createByCurrentDevice();
        const settings = Settings.default();

        const networkDefinition = settings.networks.currentNetworkDefinition();
        const network = Network.createEmpty(networkDefinition.chainId);

        return new Profile(
            header,
            [hdKeySource],
            [network],
            settings
        );
    }
}