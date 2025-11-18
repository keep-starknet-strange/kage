import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import Token from "@/types/token";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { LOG } from "@/utils/logs";
import { RpcProvider } from "starknet";

abstract class BalanceRepository {
    protected currentNetwork: NetworkId = "SN_MAIN";
    protected provider: RpcProvider;

    constructor() {
        this.provider = new RpcProvider({ nodeUrl: NetworkDefinition.mainnet().rpcUrl.toString(), batch: 0 });
    }

    public setNetwork(networkId: NetworkId, rpcProvider: RpcProvider) {
        this.currentNetwork = networkId;
        this.provider = rpcProvider
    }

    abstract getBalances(accounts: Map<Account, Token[]>): Promise<Map<AccountAddress, PublicTokenBalance[]>>;

    protected logUpdates(accounts: Map<Account, Token[]>, isPrivate: boolean) {
        if (accounts.size === 0) return;

        const lock = isPrivate ? " 🔒 " : " ";
        LOG.debug(`Requesting${lock}balances for:`)
        for (const [account, tokens] of accounts) {
            LOG.debug(`- ${account.name}:`)
            LOG.debug(`--- ${tokens.map(t => t.symbol).join(", ")}`)
        }
    }
}

export default BalanceRepository;