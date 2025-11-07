import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import NetworkDerfinition from "@/profile/settings/networkDefinition";
import Token from "@/types/token";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { RpcProvider } from "starknet";

abstract class BalanceRepository {
    protected currentNetwork: NetworkId = "SN_MAIN";
    protected provider: RpcProvider;

    constructor() {
        this.provider = new RpcProvider({ nodeUrl: NetworkDerfinition.mainnet().rpcUrl.toString(), batch: 0 });
    }

    public setNetwork(networkId: NetworkId, rpcProvider: RpcProvider) {
        this.currentNetwork = networkId;
        this.provider = rpcProvider
    }

    abstract getBalances(accounts: Map<Account, Token[]>): Promise<Map<AccountAddress, PublicTokenBalance[]>>;
}

export default BalanceRepository;