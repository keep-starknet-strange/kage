import { Type } from "class-transformer";
import { NetworkId } from "../misc";
import NetworkSettings from "./networkSettings";
import UiSettings from "./uiSettings";
import NetworkDerfinition from "./networkDefinition";

export default class Settings {
    @Type(() => NetworkSettings)
    readonly networks: NetworkSettings;

    @Type(() => UiSettings)
    readonly ui: UiSettings;

    constructor(
        networks: NetworkSettings,
        ui: UiSettings
    ) {
        this.networks = networks;
        this.ui = ui;
    }

    updateCurrentNetwork(network: NetworkId): Settings {
        return new Settings(
            this.networks.updateCurrentNetwork(network),
            this.ui
        );
    }

    addNetwork(definition: NetworkDerfinition): Settings {
        return new Settings(
            this.networks.addNetwork(definition),
            this.ui
        );
    }

    toggleBalanceVisibility(): Settings {
        return new Settings(
            this.networks,
            this.ui.toggleBalanceVisibility()
        );
    }

    static default(): Settings {
        return new Settings(
            NetworkSettings.default(), 
            UiSettings.default()
        );
    }
}