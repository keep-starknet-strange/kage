import { Expose, Transform, Type } from "class-transformer";
import { NetworkId } from "../misc";
import { AppError } from "@/types/appError";
import i18n from "@/utils/i18n";

export default class NetworkDefinition {
    @Type(() => URL)
    @Expose({ name: 'rpcUrl' })
    @Transform(({ value }) => value ? value.toString() : null)
    private readonly _rpcUrl: URL | null;

    @Type(() => URL)
    @Expose({ name: 'wsUrl' })
    @Transform(({ value }) => value ? value.toString() : null)
    private readonly _wsUrl: URL | null;

    readonly chainId: NetworkId;
    readonly accountClassHash: string;
    readonly feeTokenAddress: string;
    @Transform(({ value }) => value.toString())
    readonly blockExplorerUrl: URL | null;

    constructor(
        rpcUrl: URL | null,
        wsUrl: URL | null,
        chainId: NetworkId,
        accountClassHash: string,
        feeTokenAddress: string,
        blockExplorerUrl: URL | null
    ) {
        if (rpcUrl === null && chainId !== "SN_MAIN" && chainId !== "SN_SEPOLIA") {
            throw new AppError(i18n.t('errors.rpcUrlRequired'));
        }

        if (wsUrl === null && chainId !== "SN_MAIN" && chainId !== "SN_SEPOLIA") {
            throw new AppError(i18n.t('errors.websocketUrlRequired'));
        }

        this._rpcUrl = rpcUrl;
        this._wsUrl = wsUrl;
        this.chainId = chainId;
        this.accountClassHash = accountClassHash;
        this.feeTokenAddress = feeTokenAddress;
        this.blockExplorerUrl = blockExplorerUrl;
    }

    get isTestNetwork(): boolean {
        return this.chainId !== "SN_MAIN";
    }

    get rpcUrl(): URL {
        if (this._rpcUrl !== null) {
            return this._rpcUrl;
        }

        if (this.chainId === "SN_MAIN") {
            const rpcUrlString = process.env.EXPO_PUBLIC_RPC_SN_MAIN;
            if (!rpcUrlString) {
                throw new AppError(i18n.t('errors.rpcUrlNotSetMainnet'));
            }
            return new URL(rpcUrlString);
        } else if (this.chainId === "SN_SEPOLIA") {
            const rpcUrlString = process.env.EXPO_PUBLIC_RPC_SN_SEPOLIA;
            if (!rpcUrlString) {
                throw new AppError(i18n.t('errors.rpcUrlNotSetSepolia'));
            }
            return new URL(rpcUrlString);
        } else {
            throw new AppError(i18n.t('errors.rpcUrlNotSetNetwork'));
        }
    }

    get wsUrl(): URL {
        if (this._wsUrl !== null) {
            return this._wsUrl;
        }

        if (this.chainId === "SN_MAIN") {
            const wsUrlString = process.env.EXPO_PUBLIC_WS_SN_MAIN;
            if (!wsUrlString) {
                throw new AppError(i18n.t('errors.websocketUrlNotSetMainnet'));
            }
            return new URL(wsUrlString);
        } else if (this.chainId === "SN_SEPOLIA") {
            const wsUrlString = process.env.EXPO_PUBLIC_WS_SN_SEPOLIA;
            if (!wsUrlString) {
                throw new AppError(i18n.t('errors.websocketUrlNotSetSepolia'));
            }
            return new URL(wsUrlString);
        } else {
            throw new AppError(i18n.t('errors.websocketUrlNotSetNetwork'));
        }
    }

    get displayName(): string {
        switch (this.chainId) {
            case "SN_MAIN":
                return i18n.t('networkNames.mainnet');
            case "SN_SEPOLIA":
                return i18n.t('networkNames.sepolia');
            default:
                return this.chainId;
        }
    }

    txUrl(txHash: string): URL | null {
        const baseUrl = this.blockExplorerUrl?.toString();
        if (!baseUrl) {
            return null;
        }

        return new URL(`tx/${txHash}`, baseUrl);
    }

    static sepolia(): NetworkDefinition {
        return new NetworkDefinition(
            null,
            null,
            "SN_SEPOLIA",
            "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564",
            "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            new URL("https://sepolia.voyager.online/")
        );
    }

    static mainnet(): NetworkDefinition {
        return new NetworkDefinition(
            null,
            null,
            "SN_MAIN",
            "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564",
            "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            new URL("https://voyager.online/")
        );
    }

    static default(): NetworkDefinition {
        return NetworkDefinition.sepolia();
    }

    static wellKnown(): NetworkDefinition[] {
        return [
            NetworkDefinition.mainnet(),
            NetworkDefinition.sepolia(),
        ];
    }
}