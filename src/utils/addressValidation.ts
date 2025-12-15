import { AccountAddress as AptosAccountAddress } from "@aptos-labs/ts-sdk";
import { isValidSuiAddress } from "@mysten/sui.js/utils";
import { isAddress as isValidEVMAddress } from "ethers";
import WAValidator from 'multicoin-address-validator';
import { validateAndParseAddress } from "starknet";
import { SwapTokenChain } from "./swap";

function isValidNearAddress(address: string): boolean {
    // NEAR allows named accounts (alice.near) and implicit accounts (64 char hex)
    // Simple Regex for named accounts:
    if (/^[a-z0-9_-]+\.near$/.test(address)) return true;
    // Implicit accounts (64 hex chars):
    return /^[a-f0-9]{64}$/.test(address);
}

function isValidTonAddress(address: string): boolean {
    // Raw format: workchain_id:hex_hash (e.g., 0:abc123...)
    if (/^-?[0-9]+:[a-fA-F0-9]{64}$/.test(address)) return true;
    // User-friendly format: base64 encoded, 48 chars
    // Mainnet: starts with E or U, Testnet: starts with k or 0
    if (/^[EUk0][A-Za-z0-9_-]{47}$/.test(address)) return true;
    return false;
}

export function validateAddress(address: string, chain: SwapTokenChain) {
    switch (chain) {
        case 'ETH':
        case 'BASE':
        case 'ARB':
        case 'BSC':
        case 'POL':
        case 'OP':
        case 'AVAX':
        case 'GNOSIS':
        case 'BERA':
        case 'XLAYER':
        case 'MONAD':
        case 'ADI':
            return isValidEVMAddress(address);

        case 'BTC':
            return WAValidator.validate(address, 'bitcoin');
        case 'LTC':
            return WAValidator.validate(address, 'litecoin');
        case 'DOGE':
            return WAValidator.validate(address, 'dogecoin');
        case 'XRP':
            return WAValidator.validate(address, 'ripple');
        case 'ZEC':
            return WAValidator.validate(address, 'zcash');
        case 'BCH':
            return WAValidator.validate(address, 'bitcoincash');
        case 'CARDANO':
            return WAValidator.validate(address, 'cardano');
        case 'TRON':
            return WAValidator.validate(address, 'tron');
        case 'SOL':
            return WAValidator.validate(address, 'solana');

        case 'NEAR':
            return isValidNearAddress(address);

        case 'TON':
            return isValidTonAddress(address);

        case 'SUI':
            return isValidSuiAddress(address);

        case 'ADI':
            return AptosAccountAddress.isValid({ input: address }).valid;

        case 'STARKNET':
            try {
                validateAndParseAddress(address);
                return true;
            } catch (error) {
                return false;
            }
    }
}