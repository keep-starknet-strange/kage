import { AppError } from "./appError";

export type TokenAddress = string & {
    __type: "token";
}

export namespace TokenAddress {
    export function create(address: string): TokenAddress {
        // Validate hex format
        if (!address.startsWith('0x')) {
            throw new AppError(`Invalid token address: must start with 0x`, address);
        }
        
        // Validate hex characters (case-insensitive) and length
        const hexPart = address.slice(2);
        if (hexPart.length === 0) {
            throw new AppError(`Invalid token address: missing hex digits after 0x`, address);
        }
        
        if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
            throw new AppError(`Invalid token address: contains non-hex characters`, address);
        }
        
        // Addresses can be up to 64 hex characters (256 bits) but can be shorter
        if (hexPart.length > 64) {
            throw new AppError(`Invalid token address: too long (max 64 hex characters)`, address);
        }
        
        // Pad with leading zeros to 64 characters and normalize to lowercase
        const paddedHex = hexPart.padStart(64, '0');
        return `0x${paddedHex}`.toLowerCase() as TokenAddress;
    }

    export function createOrNull(address: string): TokenAddress | null {
        try {
            return TokenAddress.create(address);
        } catch (error) {
            return null;
        }
    }
}