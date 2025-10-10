You are building a polished, fully mocked mobile wallet called **KAGE** for the “Privacy is STARK Normal” campaign.

### Inputs (READ CAREFULLY)
- Product spec: **prd.md**
- Design system & pixel specs: **ui_ux_style_design.md**
- Engineering plan: **implementation_plan.md**

### Mission
Implement an Expo React Native (TypeScript) app that **does not call any network or blockchain**. All data and “proofs” are mocked client‑side but the app must feel production‑grade.

### Hard requirements
- Follow the **information architecture**, **user stories**, and **acceptance criteria** in `prd.md`.
- Implement the **design tokens, components, and pixel specs** from `ui_ux_style_design.md` within ±2dp.
- Follow the **stack, project structure, mock engine, and milestones** in `implementation_plan.md`.
- Default to **Dark theme**, provide Light theme toggle.
- No network calls; app works offline. Use seeded randomness so demos are reproducible.
- Implement privacy gestures: **Quick‑Hide (double‑tap), Panic Shake (camouflage screen)**, and **Screenshot Guard**.
- Implement **Viewing Keys** (grant/QR/revoke) and **Association Set** selection (mocked logic).
- Add **Maestro e2e** tests for the end‑to‑end demo script.

### Deliverables
1) Expo project with Tamagui tokens, Moti/Reanimated animations, phosphor icons.  
2) Screens: Splash, Onboarding, Passcode, Home, Send/Receive/Swap, Shielded (Deposit/Withdraw/Proof), Keys, Contacts, Activity, Settings, Camouflage.  
3) `README` with run instructions, a 1‑page **Demo Script**, and a note that this is a **mocked prototype** (no chain).  
4) TestFlight/APK‑ready build settings; 10 Maestro e2e tests passing.

### Guardrails
- Do **not** introduce any backend or network calls.
- Keep UI snappy: 60fps target; respect reduced‑motion accessibility.
- If ambiguous, favor the **design spec** over personal taste.

Now: parse the three docs, generate the project scaffolding, create tokens/themes, build components, wire screens and mocked flows, and deliver demo builds plus the Maestro test suite.
````
