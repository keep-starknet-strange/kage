# KAGE — Privacy is STARK Normal

<p align="center">
  <img src="./resources/logo/ios/app-icon.png" alt="KAGE logo" width="120" height="120" />
</p>

**Codename:** KAGE (影, “shadow”; easy to pronounce: “kah‑geh”)  
**Tagline:** Privacy is STARK Normal.

KAGE is a Expo React Native wallet proof of concept that demonstrates confidential ERC-20 payments on Starknet using [Tongo SDK](https://docs.tongo.cash/sdk/overview.html). KAGE runs on Android and iOS, and demonstrates how a mobile wallet can make confidential payments feel effortless, fast, and cheap thanks to Starknet's native elliptic curve operations.

## KAGE Features

> [!WARNING]  
> **Disclaimer:** KAGE is an experimental proof-of-concept application provided for research and demonstration purposes only.  
> It is **not production-ready**, has not undergone security audits, and **should not be used to manage real funds**.

KAGE offers a comprehensive suite of features for managing both public and confidential balances on Starknet.

**Wallet Management**: Create new wallets with randomly generated mnemonic seed phrases or restore existing wallets using known 24-word seed phrases. Each wallet supports multiple accounts derived from a single seed phrase using Hierarchical Deterministic (HD) derivation. You can freely customize account names. KAGE is compatible with both Starknet Mainnet and the Sepolia testnet.

**Tongo Confidential Operations**: Alongside standard public transfers on Starknet, KAGE integrates the [Tongo SDK](https://docs.tongo.cash/sdk/overview.html) to support confidential transactions (more details in the next section). The following Tongo operations are supported:
- Fund / Shield: Convert ERC-20 tokens into a Tongo encrypted balance.
- Send: Transfer encrypted amounts between Tongo accounts without revealing the transferred amount.
- Rollover: Convert an account’s pending encrypted balance into a usable balance. Rollovers are hidden to the users that is they are performed during a transfer/withdraw operation if there is an pending balance.
- Withdraw / Unshield: Convert encrypted Tongo balance back into ERC-20 tokens and send them to the Starknet account address.
- Ragequit: Not supported at this stage ([details here](https://docs.tongo.cash/sdk/operations/ragequit.html)).

**ERC-20 token supported (Tongo Instances)**:
- Mainnet: ETH, STRK, wBTC, USDC.e, USDC, USDT, DAI
- Sepolia: ETH, STRK, USDC

**Security Architecture**: Seed phrases are encrypted with ChaCha20-Poly1305 and stored in secure, hardware-backed device storage—iOS Keychain on iOS and Android Keystore (with TEE/StrongBox support) on Android. In settings, you can optionally enable passphrase protection and biometric authentication. Biometrics gate access to sensitive operations, and all cryptographic keys remain on the device at all times.

**Balance Management**: Public and private/shielded balances are displayed separately per account. Public balances (STRK and ERC-20 tokens) update in real-time via WebSocket connections. Private balances use Tongo's dual balance system: spending balance for transfers/withdrawals, and pending balance requiring rollover after receiving transfers. Fiat equivalents (USD) are fetched from the [AVNU Markets API](https://doc.avnu.fi/avnu-spot/markets). Private balances are locked by default and require authentication to unlock.

## Quick start
This project is built with React Native & Expo.
Make sure to [set up your environment first](https://docs.expo.dev/get-started/set-up-your-environment/).

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Expo CLI (optional, but recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kage-main
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. First, create an `.env` file in the root of the project with the following content:
```
EXPO_PUBLIC_RPC_SN_SEPOLIA="https://..."
EXPO_PUBLIC_WS_SN_SEPOLIA="wss://..."
```
Replace with your preferred RPC endpoints. For testnet, you can use public RPCs or get a free API key from providers like [Alchemy](https://www.alchemy.com/), or [Infura](https://www.infura.io/).

4. Then build/run with
```bash
# Make sure that your node modules are up-to-date
# If not, run
npm ci

# Compile the iOS app natively
npx expo run:ios
# Or Android with
npx expo run:android
```

> [!WARNING]  
> **Disclaimer:** KAGE was built as an exploration **mobile-first** wallet. There is also the ability to generate a Chrome extension out of it by running:
> ```bash
> npm run extension
> ```
> As mentioned above it is **not production-ready**, has not undergone security audits, and **should not be used to manage real funds**.

## Tongo Cash

Tongo Cash is a confidential payments protocol developed by [Fat Solutions](https://fatsolutions.xyz/) ([X Account](https://x.com/fatsolutionsxyz)) for ERC-20 tokens on Starknet, that combines privacy, auditability, and compliance. Using ElGamal encryption plus zero-knowledge (ZK) proofs, it allows users to make transfers with hidden amounts, yet still ensures the validity of each transaction cryptographically. Tongo is based on a paper by [Bünz et al. 2019](https://eprint.iacr.org/2019/191).

### What makes Tongo different?
- No trusted setup: unlike many ZK systems, it doesn’t rely on secret ceremonies or hidden parameters
- Native Starknet integration: all operations are built on Starknet’s elliptic curve primitives, making proof verification efficient and cost-effective.
- Compliance-friendly privacy: supports selective disclosure and optional auditor oversight when needed.

More on Tango Cash: [link](https://docs.tongo.cash/protocol/introduction.html)

## Use Cases and Future Ideas

### Use Cases

Tongo enables a wide range of privacy-preserving use cases. For individual privacy, users can hide payment amounts from public view for personal transactions, implement confidential payroll systems for salary payments, and conduct private commercial transactions with merchants. These use cases protect financial privacy while maintaining the ability to verify transaction validity.

For institutional compliance, Tongo supports regulated environments with auditor oversight while preserving user privacy. Cross-border payments can comply with multiple jurisdictions simultaneously, and corporate treasuries can perform internal transfers with complete audit trails. The flexible compliance models make Tongo suitable for both privacy-focused individuals and compliance-required institutions.

### Potential feature ideas
* Support for different seed phrase lengths.
* Support for more key sources (not only seed phrases, i.e. passkeys etc)
* Support for Tongo Cash Ragequit operations
* Advanced compliance features integrating viewing keys, selective disclosure, and ex-post proving directly into the wallet interface
* Backing up a user's configuration (export to file - Restore from file). 
* View private/public transaction history 
* Allow user to view fiat balances in different currencies.

## Resources

### Tongo Cash

- SDK Documentation: [https://docs.tongo.cash/docs/sdk/](https://docs.tongo.cash/docs/sdk/)
- Protocol Documentation: [https://docs.tongo.cash/protocol/introduction.html](https://docs.tongo.cash/protocol/introduction.html)
- Complete Workflow Examples: [https://docs.tongo.cash/sdk/examples/complete-workflow.html](https://docs.tongo.cash/sdk/examples/complete-workflow.html)

### Starknet

- Starknet Documentation: [https://docs.starknet.io/](https://docs.starknet.io/)
- Starknet Faucet: [https://starknet-faucet.vercel.app/](https://starknet-faucet.vercel.app/)
- Starknet.js: [https://www.starknetjs.com/](https://www.starknetjs.com/)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/micbakos"><img src="https://avatars.githubusercontent.com/u/6217006?v=4?s=100" width="100px;" alt="micbakos"/><br /><sub><b>micbakos</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/kage/commits?author=micbakos" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/0xsisyfos"><img src="https://avatars.githubusercontent.com/u/107465625?v=4?s=100" width="100px;" alt="0xsisyfos"/><br /><sub><b>0xsisyfos</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/kage/commits?author=0xsisyfos" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/teddyjfpender"><img src="https://avatars.githubusercontent.com/u/92999717?v=4" width="100px;" alt="teddyjfpender"/><br /><sub><b>teddyjfpender</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/kage/commits?author=teddyjfpender" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AbdelStark"><img src="https://avatars.githubusercontent.com/u/45264458?v=4" width="100px;" alt="AbdelStark"/><br /><sub><b>AbdelStark</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/kage/commits?author=AbdelStark" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

---
## License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
