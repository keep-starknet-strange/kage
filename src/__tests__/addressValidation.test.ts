import { validateAddress } from '@/utils/addressValidation';

describe('validateAddress', () => {
    describe('EVM chains', () => {
        const evmChains = ['ETH', 'BASE', 'ARB', 'BSC', 'POL', 'OP', 'AVAX', 'GNOSIS', 'BERA', 'XLAYER', 'MONAD'] as const;

        // Use lowercase addresses to avoid EIP-55 checksum issues
        const validAddresses = [
            '0x0000000000000000000000000000000000000000',
            '0xdead000000000000000000000000000000000000',
            '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth (lowercase)
        ];

        const invalidAddresses = [
            '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB1',  // Too short
            '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB123', // Too long
            '742d35Cc6634C0532925a3b844Bc9e7595f5bB12',   // Missing 0x
            '0xGGGd35Cc6634C0532925a3b844Bc9e7595f5bB12', // Invalid hex chars
            '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB12', // Invalid checksum
            '',
        ];

        evmChains.forEach(chain => {
            describe(chain, () => {
                validAddresses.forEach(address => {
                    it(`should validate ${address.slice(0, 15)}...`, () => {
                        expect(validateAddress(address, chain)).toBe(true);
                    });
                });

                invalidAddresses.forEach(address => {
                    it(`should reject invalid address: ${address || '(empty)'}`, () => {
                        expect(validateAddress(address, chain)).toBe(false);
                    });
                });
            });
        });
    });

    describe('BTC', () => {
        const validAddresses = [
            '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',           // P2PKH (valid checksum)
            '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',           // P2SH
            'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',  // Bech32
        ];

        const invalidAddresses = [
            '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN',  // Too short
            '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB12', // Ethereum address
            '',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address.slice(0, 20)}...`, () => {
                expect(validateAddress(address, 'BTC')).toBe(true);
            });
        });

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'BTC')).toBe(false);
            });
        });
    });

    describe('LTC', () => {
        const validAddresses = [
            'LVg2kJoFNg45Nbpy53h7Fe1wKyeXVRhMH9',  // Legacy L-address
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'LTC')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'LTC')).toBe(false);
        });
    });

    describe('DOGE', () => {
        const validAddresses = [
            'DFundmtrigzA6E25Swr2pRe4Eb79bGP8G1', // Known valid DOGE address
            'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'DOGE')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'DOGE')).toBe(false);
        });
    });

    describe('XRP', () => {
        const validAddresses = [
            'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Genesis address
            'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', // Known valid
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'XRP')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'XRP')).toBe(false);
        });
    });

    describe('ZEC', () => {
        // Note: multicoin-address-validator may have limited ZEC support
        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'ZEC')).toBe(false);
        });
    });

    describe('BCH', () => {
        const validAddresses = [
            'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
            'qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address.slice(0, 25)}...`, () => {
                expect(validateAddress(address, 'BCH')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'BCH')).toBe(false);
        });
    });

    describe('CARDANO', () => {
        // Note: multicoin-address-validator may have limited Cardano support for Shelley-era addresses
        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'CARDANO')).toBe(false);
        });
    });

    describe('TRON', () => {
        const validAddresses = [
            'TJRyWwFs9wTFGZg3JbrVriFbNfCug5tDeC',
            'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'TRON')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'TRON')).toBe(false);
        });
    });

    describe('SOL', () => {
        const validAddresses = [
            'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'SOL')).toBe(true);
            });
        });

        it('should reject invalid address', () => {
            expect(validateAddress('invalid', 'SOL')).toBe(false);
        });
    });

    describe('NEAR', () => {
        const validAddresses = [
            'alice.near',
            'bob_123.near',
            'my-account.near',
            'a35923162c49cf95e6bf26623385eb431ad920d3a35923162c49cf95e6bf2662', // 64 hex implicit
        ];

        const invalidAddresses = [
            'alice',              // Missing .near
            'Alice.near',         // Uppercase not allowed
            '.near',              // Empty name
            'alice.near.near',    // Double .near
            '',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address}`, () => {
                expect(validateAddress(address, 'NEAR')).toBe(true);
            });
        });

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'NEAR')).toBe(false);
            });
        });
    });

    describe('TON', () => {
        const validAddresses = [
            '0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8', // Raw format
            '-1:3333333333333333333333333333333333333333333333333333333333333333', // Masterchain
            'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2', // User-friendly mainnet
            'UQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p7xS', // User-friendly mainnet
            'kQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4Fg', // Testnet
        ];

        const invalidAddresses = [
            '0:83dfd552e63729b472fcbcc8c45ebcc669170255', // Too short
            'EQDtFpEwcFAEcRe5mLVh2N6C0x',                 // Too short user-friendly
            'invalid',
            '',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address.slice(0, 25)}...`, () => {
                expect(validateAddress(address, 'TON')).toBe(true);
            });
        });

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'TON')).toBe(false);
            });
        });
    });

    describe('SUI', () => {
        // SUI requires full 64-char hex addresses (32 bytes)
        const validAddresses = [
            '0x0000000000000000000000000000000000000000000000000000000000000002',
            '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
        ];

        const invalidAddresses = [
            '0x2',       // Short form may not be supported
            'invalid',
            '',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address.slice(0, 20)}...`, () => {
                expect(validateAddress(address, 'SUI')).toBe(true);
            });
        });

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'SUI')).toBe(false);
            });
        });
    });

    describe('STARKNET', () => {
        const validAddresses = [
            '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        ];

        const invalidAddresses = [
            '0xinvalid',
            'not_an_address',
            '',
        ];

        validAddresses.forEach(address => {
            it(`should validate ${address.slice(0, 20)}...`, () => {
                expect(validateAddress(address, 'STARKNET')).toBe(true);
            });
        });

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'STARKNET')).toBe(false);
            });
        });
    });

    describe('ADI (Aptos)', () => {
        // Note: Aptos SDK validation may have specific requirements
        // The SDK might require addresses to be registered on-chain
        const invalidAddresses = [
            'invalid',
            '',
        ];

        invalidAddresses.forEach(address => {
            it(`should reject invalid address: ${address || '(empty)'}`, () => {
                expect(validateAddress(address, 'ADI')).toBe(false);
            });
        });
    });
});
