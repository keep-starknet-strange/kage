import { Type } from "class-transformer";
import Header from "./header";
import KeySource, { KeySourceId } from "./keys/keySource";
import Network from "./network";
import NetworkDerfinition from "./settings/networkDefinition";
import Settings from "./settings/settings";

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

    get currentNetworkWithDefinition(): { network: Network, networkDefinition: NetworkDerfinition } {
        const networkDefinition = this.settings.networks.currentNetworkDefinition;
        const network = this.networks.find(network => network.networkId === networkDefinition.chainId);
        if (!network) {
            throw new Error(`Network ${networkDefinition.chainId} not found.`);
        }

        return { network, networkDefinition };
    }

    get currentNetwork(): Network {
        return this.currentNetworkWithDefinition.network;
    }

    getKeySourceById(id: KeySourceId): KeySource | null {
        return this.keySources.find(keySource => keySource.id === id) ?? null;
    }

    addAccountOnCurrentNetwork(accountName: string, seedPhraseWords: string[]): Profile {
        const { network, networkDefinition } = this.currentNetworkWithDefinition;

        // First check if key source exists
        const keySourceId = KeySourceId.from(seedPhraseWords);
        const keySource = this.keySources.find(keySource => keySource.id === keySourceId);

        let keySources = [...this.keySources];
        if (!keySource) {
            const newKeySource = KeySource.fromSeedPhrase(seedPhraseWords);
            keySources.push(newKeySource);
        }

        const updatedNetwork = network.addNewAccount(accountName, networkDefinition.accountClassHash, seedPhraseWords);
        const updatedNetworks = this.networks.map(network => network.networkId === updatedNetwork.networkId ? updatedNetwork : network);

        return new Profile(
            this.header,
            keySources,
            updatedNetworks,
            this.settings
        );
    }

    static createFromSeedPhrase(
        seedPhraseWords: string[]
    ) {
        const hdKeySource = KeySource.fromSeedPhrase(seedPhraseWords);
        const header = Header.createByCurrentDevice();
        const settings = Settings.default();

        const networkDefinition = settings.networks.currentNetworkDefinition;
        const network = Network.createEmpty(networkDefinition.chainId);

        return new Profile(
            header,
            [hdKeySource],
            [network],
            settings
        );
    }
}