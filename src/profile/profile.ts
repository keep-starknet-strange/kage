import { KeyPair } from "@/crypto/kms/KMSProvider";
import { AppError } from "@/types/appError";
import { Type } from "class-transformer";
import Account, { AccountAddress } from "./account";
import Header from "./header/header";
import KeySource, { KeySourceId } from "./keys/keySource";
import { KeySourceKind } from "./keys/keySourceKind";
import { NetworkId } from "./misc";
import Network from "./network";
import NetworkDefinition from "./settings/networkDefinition";
import Settings from "./settings/settings";
import SeedPhraseWords from "@/types/seedPhraseWords";

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

    get currentNetworkWithDefinition(): { network: Network, networkDefinition: NetworkDefinition } {
        const networkDefinition = this.currentNetworkDefinition;
        const network = this.networks.find(network => network.networkId === networkDefinition.chainId);
        if (!network) {
            throw new AppError(`Network ${networkDefinition.chainId} not found.`);
        }

        return { network, networkDefinition };
    }

    get currentNetwork(): Network {
        return this.currentNetworkWithDefinition.network;
    }

    get accountsOnCurrentNetwork(): readonly Account[] {
        return this.currentNetwork.accounts;
    }

    get currentNetworkDefinition(): NetworkDefinition {
        return this.settings.networks.currentNetworkDefinition;
    }

    getKeySourceById(id: KeySourceId): KeySource | null {
        return this.keySources.find(keySource => keySource.id === id) ?? null;
    }

    getAccountOnCurrentNetwork(address: AccountAddress): Account | null {
        return this.accountsOnCurrentNetwork.find(account => account.address === address) ?? null;
    }

    addAccountOnCurrentNetwork(accountName: string, seedPhrase: SeedPhraseWords): Profile {
        const { network, networkDefinition } = this.currentNetworkWithDefinition;

        // First check if key source exists
        const keySourceId = KeySourceId.from(seedPhrase);
        const keySource = this.keySources.find(keySource => keySource.id === keySourceId);

        let keySources = [...this.keySources];
        if (!keySource) {
            const newKeySource = KeySource.fromSeedPhrase(seedPhrase);
            keySources.push(newKeySource);
        }

        const updatedNetwork = network.addNewAccount(accountName, networkDefinition.accountClassHash, seedPhrase);
        const updatedNetworks = this.networks.map(network => network.networkId === updatedNetwork.networkId ? updatedNetwork : network);

        return new Profile(
            this.header.updateUsed(new Date()),
            keySources,
            updatedNetworks,
            this.settings
        );
    }

    addRestoredAccountsWithSeedPhraseOnCurrentNetwork(
        data: {
            index: number;
            accountAddress: AccountAddress;
            keySourceId: KeySourceId;
            keyPair: KeyPair;
        }[]
    ): Profile {
        const { network } = this.currentNetworkWithDefinition;

        const keySources = [...this.keySources];
        for (const derivedData of data) {
            const keySource = this.keySources.find(keySource => keySource.id === derivedData.keySourceId);
            if (!keySource) {
                keySources.push(new KeySource(derivedData.keySourceId, KeySourceKind.SEED_PHRASE));
            }
        }

        const updatedNetwork = network.addAccounts(
            data.map(data => ({
                accountAddress: data.accountAddress,
                accountName: `Restored Account ${data.index + 1}`,
                index: data.index,
                keySourceId: data.keySourceId,
                keyPair: data.keyPair
            }))
        );
        const updatedNetworks = this.networks.map(network => network.networkId === updatedNetwork.networkId ? updatedNetwork : network);

        return new Profile(
            this.header.updateUsed(new Date()),
            keySources,
            updatedNetworks,
            this.settings
        );
    }

    renameAccount(account: Account, newName: string): Profile {
        const updatedAccounts = this.accountsOnCurrentNetwork.map(acc => acc.id === account.id ? acc.updateName(newName) : acc);
        const updatedNetwork = this.currentNetwork.updateAccounts(updatedAccounts);
        const updatedNetworks = this.networks.map(network => network.networkId === updatedNetwork.networkId ? updatedNetwork : network);

        return new Profile(
            this.header.updateUsed(new Date()),
            this.keySources as KeySource[],
            updatedNetworks,
            this.settings
        );
    }

    changeNetwork(networkId: NetworkId): Profile {
        const updatedSettings = this.settings.updateCurrentNetwork(networkId);

        let network = this.networks.find(network => network.networkId === networkId);

        let networks = [...this.networks];
        if (!network) {
            network = Network.createEmpty(networkId);
            networks.push(network);
        }

        return new Profile(
            this.header.updateUsed(new Date()),
            this.keySources as KeySource[],
            networks,
            updatedSettings
        );
    }

    static createFromSeedPhrase(
        seedPhrase: SeedPhraseWords
    ) {
        return this.createFromSeedPhraseOnNetwork(
            NetworkDefinition.default(),
            seedPhrase
        );
    }

    static createFromSeedPhraseOnNetwork(
        networkDefinition: NetworkDefinition,
        seedPhrase: SeedPhraseWords
    ) {
        const settings = Settings.createFromNetworkDefinition(networkDefinition);
        const hdKeySource = KeySource.fromSeedPhrase(seedPhrase);
        const header = Header.createByCurrentDevice();
        const network = Network.createEmpty(networkDefinition.chainId);

        return new Profile(
            header,
            [hdKeySource],
            [network],
            settings
        );
    }
}