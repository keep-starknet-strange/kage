# KAGE — Privacy is STARK Normal

<p align="center">
  <img src="./resources/logo/ios/app-icon.png" alt="KAGE logo" width="120" height="120" />
</p>

**Codename:** KAGE (影, “shadow”; easy to pronounce: “kah‑geh”)  
**Tagline:** Privacy is STARK Normal.

KAGE is a polished, Expo React Native wallet prototype that explores end-to-end privacy UX for the “Privacy is STARK Normal” campaign. The goal is to pressure-test premium mobile flows, integrate privacy primitives, and share patterns the Starknet ecosystem can adopt when rolling confidential features into consumer apps.

## Why this build

- Demonstrate how a mobile wallet can make private transfers feel effortless.
- Dogfood Starknet privacy components and intentionally design UX around them before mainnet products ship.
- Prepare for integrating confidential transfers with the **Tongo Cash SDK**.

**Tongo Cash** resources:

- [Overview](https://www.tongo.cash/)
- [Tongo Demo Web App](https://demo.tongo.cash/)
- [SDK documentation](https://docs.tongo.cash/)

## Quick start
This project is built with React Native & Expo.
Make sure to [setup your environment first](https://docs.expo.dev/get-started/set-up-your-environment/).

1. First create an `.env` file in the root of the project with the following content:
```
EXPO_PUBLIC_RPC_SN_MAIN="https://..."
EXPO_PUBLIC_WS_SN_MAIN="wss://..."
EXPO_PUBLIC_RPC_SN_SEPOLIA="https://..."
EXPO_PUBLIC_WS_SN_SEPOLIA="wss://..."
```

2. Then build/run with
```bash
# Make sure that your node modules are up-to-date
# If not, run
npm ci

# Compile the iOS app natively
npx expo run:ios
# Or android with
npx expo run:android
```

### Features overview

#### Getting Started
- Create a new wallet with automatically generated seed phrase
- Restore existing wallet from 24-word seed phrase (to mainnet or sepolia)
- Set up passphrase protection with optional biometric authentication (if supported by the device)
- Create your first account and start transacting

#### Managing Your Wallet
- Create multiple accounts under one wallet with HD derivation
- Rename accounts for easy identification
- Switch between Starknet Mainnet and Sepolia testnet
- View public and private balances separately for each account
- Real-time balance updates via WebSocket connections
- View your seed phrase and which accounts/private balances it controls.
- View fiat balance (USD) using [AVNU Markets API](https://doc.avnu.fi/avnu-spot/integration/api-references#open-api-specifications).

#### Transactions supported

##### Public transactions
* **Fund** public wallet by exposing the public key. In Sepolia faucet link is provided.
* **Send** publicly to other accounts

##### Private transactions
* **Shield** your balance. This funds your private balance from your public balance.
* **Transfer** funds privetly. Transfers hide amounts and recipients on-chain.
* **Unshield** your private balance. Withdraws your private balances back to your public wallet.

**Security Architecture**
- Seed phrases encrypted with ChaCha20-Poly1305 and stored in device secure storage
- Hardware-backed encryption (iOS Keychain, Android Keystore with TEE/StrongBox)
- Biometric authentication gates access to sensitive operations
- Keys never leave the device

**Platform Support**
- Native iOS and Android apps with Expo
- Web version experimental (not tested)
- Consistent UX across all platforms



### Potential feature ideas
* Support for different seed phrase lengths.
* Support for more key sources (not only seed phrases, i.e. passkeys etc)
* Allowing user to add custom networks
* Backing up user's configuration (export to file - Restore from file). 
* View private/public transaction history 
* Allow user to view fiat balances in different currencies.