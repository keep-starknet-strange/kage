
# KAGE — UI/UX, Design System & Pixel Specs

## 1) Brand & Identity
- **Name:** KAGE (影)  
- **Pronunciation:** “kah‑geh”  
- **Concept:** Shadow + clarity. Private by default, legible by design.
- **Logo:** Minimal ghost/veil glyph inside a rounded hexagon. Stroke‑only mark for small sizes; filled for app icon.
- **App Icon:** Dark gradient (Ink → Obsidian), neon‑mint ghost glyph centered, 16% inner‑shadow ring for depth.

## 2) Design Principles
1) **Clarity before cleverness** — zero jargon; explainers close to actions.  
2) **One‑tap privacy** — the “Private” toggle is present wherever value moves.  
3) **Compliant on demand** — disclosure flows feel as refined as Send.  
4) **Tactile calm** — micro‑interactions, soft shadows, non‑intrusive haptics.  
5) **Default‑dark** — privacy‑oriented, OLED‑friendly; accessible light theme exists.

## 3) Design Tokens (Dark theme)
```json
{
  "color": {
    "bg/default": "#0B0F10",
    "bg/elevated": "#11161A",
    "bg/sunken": "#070A0C",
    "surface/glass": "rgba(255,255,255,0.06)",
    "text/primary": "#E6F0F2",
    "text/secondary": "#A6B3B8",
    "text/muted": "#7A8792",
    "brand/accent": "#4AF0B8",
    "brand/accentAlt": "#9B8CFF",
    "status/success": "#2AD38C",
    "status/warning": "#FFB545",
    "status/error":   "#FF5D5D",
    "border/subtle": "#1A2329",
    "border/strong": "#26313A"
  },
  "radius": { "sm": 8, "md": 12, "lg": 16, "xl": 24, "pill": 999 },
  "space":  [4,8,12,16,20,24,32,40,48,64],
  "elevation": {
    "e0": { "y": 0, "b": 0, "r": 0.04 },
    "e1": { "y": 2, "b": 8, "r": 0.06 },
    "e2": { "y": 6, "b": 16, "r": 0.08 },
    "e3": { "y": 12, "b": 24, "r": 0.12 }
  },
  "blur": { "soft": 14, "heavy": 22 },
  "opacity": { "muted": 0.64, "disabled": 0.38, "glass": 0.06 }
}
````

**Light theme deltas:**

* `bg/default: #F6F8FA`, `text/primary: #0B0F10`, `border/subtle: #E3E8ED`, keep `brand/accent` unchanged.

## 4) Typography

* **Font:** Inter Variable (fallbacks: System, Roboto); Mono: JetBrains Mono (for addresses).
* **Scale (base 16):**

  * **Display‑1:** 40/48, −0.4 letter‑spacing, SemiBold
  * **H1:** 28/34, −0.2, SemiBold
  * **H2:** 24/30, −0.2, SemiBold
  * **H3:** 20/26, 0, Medium
  * **Body‑L:** 17/24, 0, Regular
  * **Body:** 16/22, 0, Regular
  * **Caption:** 13/18, +0.1, Medium
  * **Mono‑S:** 13/18, −0.25, Regular (addresses)

## 5) Iconography & Illustrations

* **Icon set:** Phosphor Icons, Duotone where possible. Sizes: 16/20/24/28.
* **Stroke weight:** 1.5 for 24px; 1.25 for 20px.
* **Empty states:** abstract “mist/veil” vector motifs, low contrast.

## 6) Motion & Haptics

* **Durations:** 120ms (snappy), 180ms (default), 240ms (gentle).
* **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` for in/out; spring (200, 20) for FAB/Sheets.
* **Micro‑interactions:**

  * Toggle → 120ms slide + `Haptics.selection()`
  * Success → checkmark draw 240ms + `Haptics.notificationSuccess()`
  * Danger → subtle shake 200ms + `notificationWarning()`

## 7) Components (Anatomy & Specs)

> **Baseline device:** 390×844 pt (iPhone 13). Spacing via 8‑pt grid; tolerance ±2dp.

### 7.1 App Bar

* Height **56**; left **16** padding; right area hosts **Private** toggle (pill).
* Title: H3, centered; translucent glass background when scrolled.

### 7.2 Bottom Tab Bar

* Height **72**; top border `border/subtle`; active label Body‑S, 90% opacity; inactive 60%.

### 7.3 Buttons

* **Primary (filled):** height **52**; radius **12**; padding H **20**; label H3 Medium; bg `brand/accent`, text `#0B0F10`.
* **Secondary (outline):** height **52**; 1.5px `border/strong`; text `text/primary`.
* **Ghost:** transparent; increases `surface/glass` on press, radius **12**.

### 7.4 Toggles & Chips

* **Private Toggle Pill:** width **64**, height **34**; knob **28**; ON bg `brand/accent`; OFF bg `#20272E`.
* **Association Chips:** height **32**; radius **pill**; selected bg `brand/accent` @12% with 1.5px border `brand/accent`.

### 7.5 Cards

* Radius **16**; inner padding **16**; elevation `e1`; optional glass overlay.
* Balance Card (Home): height **132**; large number Display‑1; eye (hide) icon right.

### 7.6 Inputs

* Field height **52**; radius **12**; 1.5px border `border/subtle`; focus border `brand/accent`.
* Address field uses Mono‑S; mask middle with “••••” by default.

### 7.7 Sheets & Dialogs

* **Bottom Sheet:** max height 80% screen; handle 36×4; blur `soft`; backdrop opacity 0.36.
* **Dialog:** 320×auto; radius **16**; buttons stacked; outside tap cancels (except danger).

### 7.8 Skeletons

* Pulse 1200ms; use `surface/glass` bars with 6px radius.

## 8) Layout Patterns

* **Home (above the fold):**

  * App Bar (56)
  * Balance Card (132) → CTA row (Send/Receive/Swap/Shielded, 56 each, 12 spacing)
  * Privacy Meter pill (height 28)
  * Activity preview list (first two items, 72 each)
  * Bottom Tab (72)
* **Send (Private ON):**

  * Amount keypad (fixed 312)
  * Association Set chooser row (height 40)
  * To: Address (52)
  * Fee row (28) + ETA label
  * Primary Button (52) sticky at bottom

## 9) Accessibility

* **Tap targets ≥ 44×44**
* **Contrast:** `text/primary` on dark bg ≥ 4.5:1; disabled elements clearly indicated
* **Labels:** all buttons & icons have `accessibilityLabel`
* **Reduced motion:** respect OS setting → shorter durations, no parallax

## 10) Screen‑by‑Screen Pixel Specs (key ones)

### 10.1 Splash / Welcome

* Logo glyph centered (96), title H1 below with 12 spacing, subcopy Body with 8 spacing.
* CTA “Create Wallet” (52) and “I already have one” (ghost).

### 10.2 Onboarding — Security

* Step chip “1/3” top‑right. Card (radius 16) with copy; list of toggles:

  * Paranoid Mode (subtitle “auto‑lock 15s, block screenshots, obfuscate balances”)
  * Biometrics (Face ID / Touch ID)
* Next → Passcode.

### 10.3 Home

* Balance Card (large number, eye icon). CTA row (Send/Receive/Swap/Shielded) icons 24, labels Caption.
* Privacy Meter pill right below: text “Private routing ON”.
* Activity list items: 72 height, left icon 36, middle stack (title/body), right amount Mono‑S.

### 10.4 Send (Private ON)

* Amount display: Display‑1; keypad 3×4 grid, keys 64×64, 12 spacing.
* Association Set row: chips “Recommended / Custom / Minimal”.
* Confirm sheet: summary rows (To / Amount / Assoc set / Fee), progress animation 2.4s.

### 10.5 Shielded Pools

* Tabs: Deposit / Withdraw; Denomination chips (0.1 / 1 / 10 / Variable)
* Proof Builder steps: checkmarks animate sequentially; final state card with “Export proof” CTA.

### 10.6 Viewing Keys

* List of issued keys; each row shows Recipient, Last Access, Status (Active/Revoked).
* Actions: “Copy”, “QR”, “Revoke”; revoke shows danger dialog.

### 10.7 Settings

* Privacy (Private default, Screenshot Guard, Camouflage, Quick‑Hide gesture)
* Security (Change Passcode, Biometrics, Decoy PIN, Auto‑lock)
* Data (Reset Demo, Export Mock Data JSON)
* About (Version, Licenses)

## 11) Content Inventory (strings)

* Provide separate `en.json` with keys mirroring screen sections; tone concise, friendly, non‑patronizing.

## 12) Sound (optional, off by default)

* Soft “wisp” confirm, subtle “tick” on keypad; device haptics primary feedback channel.
