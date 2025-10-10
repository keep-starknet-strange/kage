# KAGE — A Privacy‑First Wallet for Starknet (Showcase App, Mocked)

**Codename:** KAGE (影, “shadow”; easy to pronounce: “kah‑geh”)  
**Tagline:** Privacy is STARK Normal.  
**Purpose:** A polished, mobile‑first wallet that **demonstrates end‑to‑end privacy UX** for the PISN campaign—**fully mocked**, no blockchain or backend. It must feel like a top consumer app.

## 0) Scope & Non‑Goals
- **In scope (MVP demo):**
  - Onboarding (standard / paranoid modes), passcode/biometrics, decoy PIN
  - Wallet home with balances, private mode, quick‑hide, stealth screenshots
  - Private Send / Receive (with “Private” toggle), Swap, and LP flows (all mocked)
  - “Shielded Pools” UX (deposit/withdraw), association‑set selection, mock “clean funds proof”
  - Viewing keys (create, export QR/URI, revoke), disclosure center
  - Address hygiene (rotating receive IDs), “Camouflage Mode” UI (disguised look)
  - Activity history & filters (private/public), contacts with per‑contact viewing keys
  - Settings: privacy controls, app lock timer, data wipe, language, theme
  - Accessibility (dynamic type), haptics, micro‑interactions, 60fps target
- **Out of scope (MVP):**
  - Real on‑chain transactions, KMS/remote key custody, any network calls
  - Real compliance integrations, bridge connectivity, protocol integrations
  - Desktop/web builds; this MVP is **mobile only** (iOS/Android)

## 1) Personas
- **Privacy‑aware DeFi user (“Sara”)** — wants simple, beautiful private flows and selective disclosure.
- **Crypto‑curious mainstream user (“Noah”)** — needs clarity, safety, delightful UI, zero jargon.
- **Compliance‑conscious user (“Asha”)** — wants exportable proofs/viewing keys for counterparties.
- **Builder (“Dev”)** — evaluating feasibility of private UX patterns and SDK mental model.

## 2) Value Proposition
- **Private when you want it. Compliant when you need it.**  
- **Frictionless UX:** one‑tap “Private” toggle across send/swap/LP.  
- **Selective disclosure:** viewing keys & association proofs (mocked) to share without doxxing your graph.  
- **Safety:** decoy PIN, panic gestures, screenshot guard, instant “quick‑hide.”

## 3) User Stories (MVP, must‑have)
1. As a user, I can create a wallet (12‑word preview, mocked), set a 6‑digit passcode, and enable biometrics.
2. I can opt into **Paranoid Mode**: screenshot blocking ON by default, auto‑lock 15s, balance obfuscation.
3. I can see a **Wallet Home**: balances (BTC wrapper + USDC), a Privacy Meter, and one‑tap “Private” mode.
4. I can **Send** funds with a **Private toggle**; a sheet explains association sets and fee estimate (mock).
5. I can **Receive** using rotating addresses (UI cycles post‑share) and copy/QR share.
6. I can **Swap** (mock router) with Private toggle; flow shows shielded balance usage.
7. I can **Deposit to Shielded Pools** and later **Withdraw with an association proof** (all mocked).
8. I can **Export a viewing key** as QR/URI and later **revoke** it; a disclosure log updates.
9. I can enable a **Decoy PIN** that opens a fake low‑balance “decoy wallet.”
10. I can **Quick‑Hide** balances with a double‑tap, and **Panic Shake** to show a camouflage screen.
11. I can view **History** with filters: All | Private | Public | Internal (keys/proofs).
12. I can manage **Contacts** with per‑contact viewing key permissions (grant/revoke).

## 4) Feature Requirements

### 4.1 Privacy Controls
- **Private Mode toggle (global):** switches default route to shielded flows; sticky per‑session.
- **Screenshot Guard:** prevent capture (toggleable), auto‑pixelate sensitive widgets if disabled.
- **Camouflage Mode:** one‑tap UI skin (e.g., looks like a calculator) until long‑press reveals wallet.
- **Quick‑Hide:** double‑tap anywhere to obfuscate balances (•••); triple‑tap restores.
- **Panic Shake:** hides app with system sheet (share/menu) and clears recent screen thumbnails.

### 4.2 Shielded Pools (Mocked)
- **Association Set selection:** “Recommended (clean) / Custom / Minimal” with explanations.
- **Deposit / Withdraw:** denomination choice (0.1 / 1 / 10) + variable option; fee/tooltips (mock).
- **Proof Builder:** progress steps (Prepare → Prove → Post), 2–4s animated build (mock).
- **Clean Funds Proof:** tappable chip in history entries; export as QR/URI (string payload).

### 4.3 Viewing Keys & Disclosures
- **Create / Rotate / Revoke viewing keys** (local only); show “granted to X contacts.”
- **Disclosure Center:** list issued keys, last access time (mocked pings), revoke all.

### 4.4 Address Hygiene
- **Rotating receive IDs** (on share or after N minutes). UI shows “Next address queued.”
- **Address Aliases** per contact; copy masks middle chars by default; reveal on long‑press.

### 4.5 Safety & Recovery
- **Decoy PIN** (secondary passcode opens decoy state & history).
- **Auto‑Lock Timer** (15s–5m), **Biometric unlock**, **Local wipe** after N failed attempts (mock).

## 5) Non‑Functional Requirements
- **Performance:** 60fps; first paint < 600ms; navigation < 200ms; animations < 240ms.
- **Accessibility:** WCAG AA contrasts, dynamic type, screen reader labels, haptic confirmation.
- **Offline‑only:** no network calls; all randomization seeded for deterministic demos.
- **Security (local):** secrets in secure storage; redact in app switcher thumbnails; crash‑safe persistence.

## 6) Information Architecture
- **Tabs (bottom):** Home · Actions(+) · Activity · Contacts · Settings  
- **Primary actions FAB (+):** Send, Receive, Swap, Shielded, View Key
- **Global top bar:** privacy toggle · quick‑hide · search

## 7) Copy & Tone (examples)
- **Private toggle tooltip:** “Route through shielded pools. Share proofs only when you choose.”
- **Association set helper:** “Exclude risky flows. Keep value, protect your graph.”
- **Decoy PIN:** “Opens a minimal wallet for duress scenarios.”

## 8) Acceptance Criteria (MVP)
- All user stories demonstrably complete on device/simulator.
- Zero network calls. App functions in airplane mode.
- Visuals match `ui_ux_style_design.md` within ±2dp spacing tolerance.
- 95% unit coverage for core presenters, 10+ Maestro e2e flows green.
- 60fps interactions on a mid‑range Android and iPhone 12‑class device.

## 9) Risks & Mitigations
- **Over‑complex privacy settings →** sane defaults + progressive disclosure.
- **Anxiety from “mock” status →** persistent “Demo Mode” banner + easily resettable data.
- **Gesture discoverability →** first‑run coach marks + accessible alternatives in settings.

## 10) Demo Script (suggested)
1) Onboard in Paranoid Mode → 2) Private toggle on Home → 3) Private Send  
4) Deposit to Shielded → 5) Withdraw w/ proof → 6) Export viewing key → 7) Panic Shake & Camouflage  
8) Revoke viewing key → 9) Open with Decoy PIN → 10) Restore real wallet.
