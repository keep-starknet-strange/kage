# KAGE — Privacy is STARK Normal

<p align="center">
  <img src="./kage-logo.png" alt="KAGE logo" width="120" height="120" />
</p>

**Codename:** KAGE (影, “shadow”; easy to pronounce: “kah‑geh”)  
**Tagline:** Privacy is STARK Normal.

KAGE is a polished, Expo React Native wallet prototype that explores end-to-end privacy UX for the “Privacy is STARK Normal” campaign. The goal is to pressure-test premium mobile flows, integrate privacy primitives, and share patterns the Starknet ecosystem can adopt when rolling confidential features into consumer apps.

## Why this build

- Demonstrate how a mobile wallet can make private transfers feel effortless.
- Dogfood Starknet privacy components and intentionally design UX around them before mainnet products ship.
- Prepare for integrating confidential transfers with the **Tongo Cash SDK**.

Tongo Cash resources:

- [Overview & demo video](https://docs.tongo.cash/)
- [SDK documentation](https://docs.tongo.cash/docs/sdk/)

## Current status
⚠️🚧 This project is under development. 

Features of POC:
* Create a new wallet with a random mnemonic.
* Restore wallet from known mnemonic.
* Deploy a Starknet account. ⚠️ Make sure that your account has some strks before deploying. [Faucet](https://starknet-faucet.vercel.app/)
* Display STRK Balance.
* Create confidential STRK Balance (⚠️ 1 Tongo STRK = 1 STRK [docs](https://docs.tongo.cash/sdk/examples/complete-workflow.html?highlight=1%3A1#key-concepts)).
* Tongo operations
    * See tongo balance (pending & spending) with rate to erc20 balance.
    * Fund tongo balance.
    * Rollover from pending to spending balance.
    * Transfer to 3rd party.
    * Withdraw balance from confidential to starknet account.
    * Ragequit balance from confidential to starknet account (i.e. withdraw all balance).
* POC handles only happy paths for now. No error handling, no event subscriptions (i.e. you need to manually refresh your balance), assumes internet connection, mnemonic is encrypted but does not require authorization to decrypt. 


## Quick start
This project is built with React Native & Expo.
Make sure to [setup your environment first](https://docs.expo.dev/get-started/set-up-your-environment/).

```bash
# Make sure that your node modules are up-to-date
# If not, run
npm ci

# Start expo and later choose the simulator/emulator of your preference
npx expo start --clear

```
