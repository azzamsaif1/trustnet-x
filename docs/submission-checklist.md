# TrustNet X — Submission Checklist

## Repository

- [x] GitHub public repo: [azzamsaif1/trustnet-x](https://github.com/azzamsaif1/trustnet-x)
- [x] No secrets committed (`.env` gitignored, only `.env.example` present)
- [x] `.gitignore` covers: `.env`, `node_modules/`, `dist/`, keypair files, `devnet-wallet.json`, `*.keypair.json`, `*.secret.json`

## Installation & Running

- [x] `npm install` completes without errors (Node.js >= 20)
- [x] `npm run dev` starts Vite dev server (dashboard at localhost:5173)
- [x] `npm run demo` runs full CLI demo (no browser needed)
- [x] `npm test` passes all tests (23/23 via Vitest)
- [x] `npm run build` produces production build
- [x] `npm run typecheck` passes with zero errors
- [x] Dashboard opens and renders correctly

## Demo Mode (Simulated)

- [x] "Run TrustNet Demo" button visible on dashboard load
- [x] One-click runs full WANT → BID → AWARD → DEPOSITED → DELIVERED → VERIFIED → RELEASED flow
- [x] Demo progress log shows each step in real-time
- [x] Cost inversion clearly visible (cheap bid → expensive real cost)
- [x] Buyer selects premium_agent over cheap_agent
- [x] "Cheapest bid lost because risk made it more expensive" callout visible
- [x] Settlement labeled `SIMULATED` — no fake Explorer links
- [x] Setup instructions shown for enabling live devnet mode
- [ ] Demo video recorded (screen recording of dashboard flow)
- [x] 3-minute demo script ready (`docs/demo-script.md`)

## Live Devnet Mode

- [x] `VITE_SETTLEMENT_MODE=live` enables real transactions
- [x] Wallet JSON support (`VITE_WALLET_PATH`)
- [x] Base58 keypair support (`VITE_BUYER_KEYPAIR_B58`)
- [x] Keypair conversion script: `scripts/keypair-to-base58.ts`
- [x] Auto-fallback to simulated mode on failure
- [x] Fallback reason displayed to user
- [x] `LIVE DEVNET` badge shown on successful live settlement
- [x] Valid Explorer link only in live mode
- [x] No invalid Explorer page ever opens
- [x] 5-minute live setup documented in README

## Technical Requirements

- [x] TypeScript-first (zero JavaScript source files)
- [x] Built on Solana x CoralOS pattern (`deliverService()` fork point)
- [x] Solana devnet integration (Explorer URL with `?cluster=devnet`)
- [x] Deterministic engines — works with zero LLM keys
- [x] 7 engines: risk, insurance, escrow-policy, reputation, fraud, underwriting-model, explainability
- [x] 3 underwriter personas: conservative, aggressive, fraud-specialist (with veto)
- [x] 7-step escrow state machine
- [x] Verifier gate (5-check quality validation)
- [x] Adaptive learning engine with before/after visualization

## Documentation

- [x] README with 60-second quickstart
- [x] README with 5-minute live devnet setup
- [x] Architecture diagram (text-based)
- [x] Environment variables documented
- [x] Troubleshooting section (airdrop, wallet, RPC, fallback)
- [x] `docs/pitch.md` — 5-slide pitch deck
- [x] `docs/demo-script.md` — 3-minute demo script
- [x] `docs/submission-checklist.md` — this file
- [x] `docs/build-report.md` — build report

## Judge Experience

- [x] "For Judges" section in dashboard with one-line pitch
- [x] Clear instructions on what to click
- [x] Expected outcome documented
- [x] Explorer link area (live mode only — no fake links)
- [x] "Why this is not another marketplace" explanation

## Solana / Explorer

- [x] Explorer link only shown with real transaction signature (live mode)
- [x] Simulated mode clearly labeled — no clickable Explorer link
- [x] Live mode: `explorer.solana.com/tx/<real-sig>?cluster=devnet`
- [x] Instructions for live devnet mode in README
- [x] Mainnet RPC blocked (devnet-only safety check)

## Submission Form

- [ ] Submission form completed on hackathon platform
- [x] Pitch deck ready (`docs/pitch.md`)
- [x] GitHub repo URL ready
