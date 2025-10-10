
# KAGE — Expo React Native Mocked MVP Implementation Plan

## 1) Tech Stack (no backend, no chain)
- **Runtime:** React Native + **Expo** (current stable), TypeScript, Expo Router (file‑based)
- **UI & Tokens:** **Tamagui** (design tokens + responsive props) or **NativeWind** (Tailwind‑style).  
  - _Pick one for MVP; recommend **Tamagui** for themeable tokens & performance._
- **Animation:** react‑native‑reanimated, react‑native‑gesture‑handler, **Moti**
- **Graphics & Effects:** expo‑blur, react‑native‑svg; (optional) @shopify/react‑native‑skia for custom flourishes
- **Icons:** phosphor‑react‑native
- **State:** Zustand (slices: user, wallet, privacy, mockChain)
- **Persistence:** expo‑secure‑store (secrets), AsyncStorage for non‑secret UI prefs
- **Security/Privacy:** expo‑screen‑capture, expo‑local‑authentication, expo‑haptics
- **QR & Clipboard:** react‑native‑qrcode‑svg, expo‑clipboard
- **Forms & Validation:** react‑hook‑form + zod
- **i18n:** react‑i18next
- **Data Gen:** @faker‑js/faker + seedrandom
- **Testing:** Jest + React Native Testing Library; **Maestro** for e2e flows (cross‑platform)
- **Tooling:** ESLint, Prettier, TypeScript strict, Husky pre‑commit

## 2) Project Structure
````

apps/kage/
app/                         # Expo Router
(tabs)/
home.tsx
actions.tsx
activity.tsx
contacts.tsx
settings.tsx
send/
index.tsx
confirm.tsx
result.tsx
shielded/
index.tsx
deposit.tsx
withdraw.tsx
proof.tsx
keys/
index.tsx
grant.tsx
revoke.tsx
auth/
onboarding.tsx
passcode.tsx
decoy.tsx
components/
ui/ (Buttons, Inputs, Cards, Sheet, Dialog, Toggle, Chip, Skeleton, Meter)
composables/ (PrivateToggle, BalanceCard, AssociationChips, AddressField, CoachMarks)
design/
tokens.ts (from ui_ux_style_design.md)
theme.ts
domain/
models.ts         # TS interfaces (Wallet, Txn, ShieldedOp, ViewingKey)
mockChain.ts      # deterministic mock data + fake “prove” steps
privacy.ts        # privacy state machine (Private ON/OFF, gestures)
disclosure.ts     # viewing key grant/revoke + logs
stores/
useUserStore.ts
useWalletStore.ts
usePrivacyStore.ts
useMockChainStore.ts
utils/
format.ts, number.ts, time.ts, seed.ts, haptics.ts
assets/
fonts/, icons/, lotties/, images/
tests/
unit/, e2e/

````

## 3) Domain Models (TypeScript interfaces – for guidance)
```ts
export type Currency = 'BTC' | 'USDC';

export interface Balance {
  currency: Currency;
  publicAmount: number;
  shieldedAmount: number;
}

export type AssocSet = 'RECOMMENDED' | 'CUSTOM' | 'MINIMAL';

export interface Txn {
  id: string;
  type: 'SEND' | 'RECEIVE' | 'SWAP' | 'DEPOSIT' | 'WITHDRAW' | 'DISCLOSURE';
  privacy: 'PUBLIC' | 'PRIVATE';
  currency: Currency;
  amount: number;
  toFrom: string;
  assocSet?: AssocSet;
  fee: number;
  timestamp: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface ViewingKey {
  id: string;
  label: string;           // contact or purpose
  createdAt: number;
  revokedAt?: number;
  uri: string;             // kagevk://<payload>
  lastAccessAt?: number;   // mocked ping updates
}
````

## 4) Mock Engine

* **Seeded RNG** for deterministic balances/txns per install.
* **MockChain API (local only):**

  * `getBalances(): Balance[]`
  * `send({to, amount, privacy, assocSet}) → Promise<Txn>`
  * `depositShielded({amount, denom}) → Promise<ShieldedOp>`
  * `withdrawShielded({amount, assocSet}) → Promise<{ proof: string }>`
  * `issueViewingKey({label}) → ViewingKey`
  * `revokeViewingKey(id)`
* **Proof Builder:** progress bar with 3–4 staged events over ~2.4s; success/failure branch (1% fail to demo handling).
* **Association Set:** presets adjust fee/ETA labels only (no real logic).

## 5) Key Screens & Flows (build order)

1. **Onboarding** (coach marks, Paranoid Mode)
2. **Home** (BalanceCard, Privacy Meter, Activity)
3. **Send/Receive** with Private toggle + Confirm sheet
4. **Shielded Pools** (Deposit/Withdraw/Proof screens)
5. **Viewing Keys** (list, grant, QR, revoke)
6. **Contacts** (create, grant viewing key)
7. **Settings** (privacy/security controls, decoy PIN, reset demo)

## 6) Gestures & Privacy UX

* **Quick‑Hide:** global double‑tap (gesture handler at root) → balances obfuscated.
* **Panic Shake:** listens to accelerometer threshold; shows camouflage (Calculator UI) until long‑press 2s.
* **Camouflage Mode:** toggle in Settings; persists.

## 7) Theming Implementation

* Tokens from `ui_ux_style_design.md` → `design/tokens.ts`.
* Tamagui theme file maps tokens to components; dark as default, light available via Settings.
* Components accept `variant="primary|secondary|ghost"`, `size="sm|md|lg"` consistent with specs.

## 8) Animation & Haptics

* Use **Moti** for micro‑interactions; Reanimated for sheet transitions and meter changes.
* Haptics wrapper `utils/haptics.ts` with semantic calls: `selection`, `success`, `warning`.

## 9) Accessibility & Internationalization

* All tappables ≥ 44dp; add `accessibilityLabel` & `accessibilityRole`.
* Dynamic type scaling via Tamagui tokens.
* `en` only for MVP; structure ready for `i18n`.

## 10) Testing Strategy

* **Unit:** stores, mockChain, disclosure logic.
* **Component:** Button, Toggle, AddressField, Sheets.
* **e2e (Maestro):** Onboard → Private Send → Deposit → Withdraw w/ proof → Export VK → Panic Shake → Decoy PIN → Restore.

## 11) Milestones & Timeline (aggressive 3–4 weeks for MVP)

* **M0 — Foundations (3–4 days):**

  * Expo app scaffold, Router, tokens/themes, icons/fonts, global providers
  * Secure‑store wiring, screen‑capture guard, haptics
* **M1 — Core flows (1 week):**

  * Onboarding (passcode/biometric/paranoid), Home (balances/activity), Actions sheet
* **M2 — Private actions (1 week):**

  * Send/Receive (Private toggle), Shielded (Deposit/Withdraw/Proof), Privacy Meter
* **M3 — Disclosures & contacts (4–5 days):**

  * Viewing keys (grant/QR/revoke), Contacts, History filters
* **M4 — Polish & QA (4–5 days):**

  * Gestures (Quick‑Hide, Panic Shake), Camouflage, animations, Maestro suite, bug bash
* **Deliverables:** TestFlight/APK demo builds, README with demo script

## 12) Acceptance Gates

* Visuals match design spec; all flows work offline; 60fps on test devices; 10 Maestro tests pass.

## 13) Risks & Mitigations

* **Gesture conflicts** → priority & cancel propagation at root; setting to disable gestures.
* **Performance on low‑end Android** → reduce blur radius; pre‑rasterize shadows; avoid heavy Skia paths.
* **Discoverability** → first‑run tutorial, Help center links, coach marks.

## 14) Post‑MVP Ideas (stretch)

* Passkey sign‑in to decoy profile; multi‑profile switcher; secure notes; demo “clean funds” verifier view.
