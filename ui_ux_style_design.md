# KAGE Pay — UI/UX, Design System & Pixel Specs

## 1) Brand & Identity
- **Name:** KAGE Pay  
- **Concept:** Precision privacy with neo-bank luxury. Think frosted glass, metal accents, and deep violet energy lines.  
- **Logo:** Monoline ghost glyph encased in a rounded diamond. Use glyph only on light surfaces; pair with wordmark "KAGE" in SemiBold Inter for headers.  
- **App Icon:** Soft pearl → smoked graphite vertical gradient, centered ghost glyph in electro violet (#5D3EF7), subtle 12% inner glow.

## 2) Design Principles
1. **Luminous minimalism** — airy light surfaces with deliberate contrast; nothing noisy.
2. **Confidence in motion** — micro-interactions feel engineered, never playful; durations 120–220 ms.
3. **Privacy, always on** — routing pill, quick-hide cues, and status indicators live near payment actions.
4. **Tactile clarity** — large tap targets, crisp typography, purposeful dividers and hairlines.
5. **Single premium theme** — no toggles. One crafted palette: pearl light, graphite neutrals, deep violet accent.

## 3) Design Tokens (single theme)
```json
{
  "color": {
    "bg/default": "#F6F7FB",
    "bg/elevated": "#FFFFFF",
    "bg/sunken": "#EEF0F5",
    "surface/glass": "rgba(255,255,255,0.56)",
    "surface/overlay": "rgba(16,18,26,0.36)",
    "text/primary": "#141824",
    "text/secondary": "#3E4354",
    "text/muted": "#6C7285",
    "text/inverted": "#FFFFFF",
    "brand/accent": "#4E3CC8",
    "brand/accentSoft": "#7260F2",
    "brand/glow": "rgba(93,62,247,0.16)",
    "status/success": "#2FB984",
    "status/warning": "#F5A623",
    "status/error": "#E94B65",
    "border/subtle": "#E4E6EF",
    "border/strong": "#C9CCDA",
    "shadow/primary": "rgba(20,24,36,0.12)",
    "shadow/deep": "rgba(20,24,36,0.24)"
  },
  "radius": { "xs": 6, "sm": 10, "md": 14, "lg": 18, "xl": 24, "pill": 999 },
  "space": [4,8,12,16,20,24,32,40,48,64],
  "elevation": {
    "e0": { "y": 0, "b": 0, "r": 0.04 },
    "e1": { "y": 2, "b": 12, "r": 0.08 },
    "e2": { "y": 8, "b": 24, "r": 0.12 },
    "e3": { "y": 16, "b": 32, "r": 0.18 }
  },
  "blur": { "glass": 22, "sheet": 28 },
  "opacity": { "muted": 0.64, "disabled": 0.38, "overlay": 0.22 }
}
```

## 4) Typography
- **Primary font:** Inter Variable (weights 400–700).  
- **Numerics & codes:** JetBrains Mono Medium for account identifiers.  
- **Scale (base 16):**
  - Display: 40/48, -0.4 tracking, SemiBold (hero balances)
  - Title XL: 28/34, -0.2, SemiBold (screen headers)
  - Title L: 24/30, -0.1, Medium (card headers)
  - Body L: 18/26, 0, Regular (explainer copy)
  - Body: 16/24, 0, Regular (general text)
  - Caption: 13/18, +0.1, Medium (meta labels)
  - Mono: 14/20, -0.25 (addresses, amounts)

## 5) Iconography & Illustration
- **Icon set:** Phosphor Icons, duotone weight, 22/28px sizes.  
- **Stroke weight:** 1.5 for 24px icons; maintain even optical weight with text.  
- **Illustrations:** Soft-vector gradients with violet glow; avoid literal money imagery.

## 6) Motion & Haptics
- **Durations:** 120 ms (taps), 180 ms (sheet open/close), 220 ms (success states).  
- **Easing:** `cubic-bezier(0.18,0.82,0.22,1)` for general transitions; spring (180, 18) for floating action slide-ups.  
- **Haptics:** selection for toggles/chips, success for confirmations, warning for validation errors.  
- Respect **Reduce Motion**: shorten to 80 ms fades, disable parallax, replace with gentle opacity shifts.

## 7) Components — Anatomy & Specs
*(Baseline viewport: 390×844 pt iPhone 13. Grid: 4pt inner, 8pt macro. Tolerance ±2 dp.)*

### 7.1 App Bar
- Height **60** with 20 side padding.  
- Left: wordmark; right: quick-hide icon button (32×32).  
- Blur background at scroll (`blur glass`).

### 7.2 Balance Hero Card
- Height **148**, radius **lg**, gradient background `linear(225°, #FFFFFF 0%, #EBEDF6 100%)`.  
- Drop shadow `shadow/primary`, highlight ring using `brand/glow`.  
- Display value in Display size; subtitle Body; quick-hide eye icon top-right.

### 7.3 Action Chips
- Width flexible, min 104, height **56**, radius **md**.  
- Border `border/subtle`, background `surface/glass` (60% opacity).  
- Active state: fill with `brand/accent` (8% tint) + 1.5px border `brand/accentSoft`.

### 7.4 Buttons
- **Primary:** height **54**, radius **md**, gradient `#4E3CC8 → #7260F2`, text `text/inverted`.  
- **Secondary:** height **54**, border 1.5px `border/strong`, text `text/primary`.  
- **Ghost:** transparent, pressed state uses `brand/glow` background.

### 7.5 Inputs
- Height **54**, radius **md**, border 1.25px `border/subtle`.  
- Focus border `brand/accent`; inner shadow `shadow/primary` at 6% for depth.  
- Placeholder color `text/muted` @ 56%.

### 7.6 Chips & Toggles
- **Filter chip:** height **34**, padding H 18, radius **pill**, default border `border/subtle`, selected fill `brand/accent` @ 12% with text `brand/accent`.  
- **Private routing switch:** track 60×34, knob 30, ON color `brand/accent`, OFF `#D0D3E2`.

### 7.7 Cards & Sheets
- **Standard card:** radius **lg**, padding 20, shadow `shadow/primary`.  
- **Insight card:** add 1px top divider using `brand/glow`.  
- **Bottom sheet:** top radius **xl**, handle 36×5, background `bg/elevated` with blur `sheet` and border 1px `border/subtle`.

### 7.8 Keypad
- Keys 72×72, spacing 12, label Title L, background `bg/elevated`, pressed state `brand/accent` @ 10%.

## 8) Layout Patterns
- **Home:**
  1. App Bar (60)  
  2. Balance Hero (148)  
  3. Quick Insights row (card height 92, 16 gap)  
  4. Action Chips row (Send / Receive / Activity)  
  5. Activity preview list (two rows, each 76 high)  
  6. Tab bar (72)
- **Send:**
  - Header Title XL with breadcrumb text.  
  - Summary card (min 180) showing amount + private toggle.  
  - Association chips row (min height 40).  
  - Recipient input.  
  - Keypad anchored bottom via safe-area inset.
- **Receive:**
  - QR card centered with 28 spacing top, 200 QR size.  
  - Buttons inline under QR, 16 gap.  
  - Next address card margin top 20.
- **Activity:**
  - Filter chips horizontal scroll margin 24.  
  - List items 76 high with 20 padding, trailing amount right-aligned.

## 9) Accessibility
- Tap targets ≥ 44×44.  
- Contrast ratios ≥ 4.5:1 for primary text, ≥ 3:1 for secondary on tinted backgrounds.  
- Provide `accessibilityLabel` for icons (Quick Hide, Panic Shake toggle).  
- Respect dynamic type: typography scales in 4 steps without breaking layout.  
- Haptics mirrored with spoken feedback (e.g., announce “Balances hidden”).

## 10) Content & Voice
- Microcopy: concise, confident. Example headlines: “Shielded and ready”, “Private routing engaged”.  
- Provide `locales/en.json` strings grouped by screen (`home`, `send`, `receive`, `activity`, `controls`).

## 11) Assets
- **Fonts:** bundle Inter + JetBrains Mono from Expo Google fonts.  
- **Illustrations:** export as optimized SVG or Lottie (under 80 KB).  
- **Sound:** remain muted by default; optional subtle chime on success.

## 12) Testing Notes
- Visual regression via screenshots of Home, Send keypad, Receive QR, Activity filters.  
- Maestro flows must assert pixel alignment for hero card padding (24) and keypad spacing (12).
