---
name: testing-trustnet-dashboard
description: Test the TrustNet X dashboard and CLI demo end-to-end. Use when verifying UI rendering, cost inversion logic, escrow flow, or settlement proof.
---

# Testing TrustNet X Dashboard

## Prerequisites

- Node.js >= 20
- No API keys or secrets needed (deterministic engines)

## Setup

```bash
cd /home/ubuntu/repos/trustnet-x
npm install
npm run dev  # Starts Vite dev server (usually port 5173, falls back to 5174 if busy)
```

## Key Test Assertions

### 1. Dashboard loads with demo data
- Navigate to localhost:5173 (or whatever port Vite reports)
- Wait ~5 seconds for the demo animation to complete (7 escrow states)
- All sections should render: Buyer Task, Escrow Timeline, Bid Table, Underwriting Decision, Settlement Proof

### 2. Cost inversion (the WOW moment)
- CheapBot-9000: bid 0.20, real cost ~0.78 SOL, risk HIGH, "CHEAPEST BID" badge (red)
- PremiumAudit-Pro: bid 0.50, real cost ~0.51 SOL, risk LOW, "SELECTED" badge (green)
- Callout text: "Cheapest bid lost because risk made it more expensive."
- The cheapest bid must NOT be selected

### 3. Escrow timeline reaches RELEASED
- All 7 states visible: WANT, BID, AWARD, DEPOSITED, DELIVERED, VERIFIED, RELEASED
- All dots green/completed after animation finishes

### 4. Settlement proof
- Green badge: "VERIFIED — RELEASE"
- 5/5 checks with checkmarks: Risk Summary, Vulnerabilities, Recommendation, Confidence Score, Delivery Hash
- "View on Solana Explorer (devnet)" button with correct URL pattern

### 5. Underwriter panel
- 3 opinions: Conservative (~85%), Aggressive (~72%), Fraud Specialist (~90%)
- All recommend premium_agent

### 6. CLI demo
```bash
npm run demo
```
- Should output: "★ Recommended: premium_agent"
- Should output: "Buyer selects: PremiumAudit-Pro"
- Verification result: PASSED
- Explorer URL with ?cluster=devnet

## Known Issues / Gotchas

- If Vite port 5173 is busy, it auto-assigns 5174 — check terminal output
- The `process.argv` guard in `src/service/index.ts` is critical — without it, the browser throws `TypeError: Cannot read properties of undefined` because Vite defines `process.env` but not `process.argv`
- The demo animation takes ~5 seconds to complete; take screenshots after it finishes
- The "Re-run Demo" button at the bottom re-triggers the full animation

## Secrets Needed

None — the demo runs entirely with deterministic engines. No LLM keys, no Solana wallets required.

Optional (for real on-chain settlement):
- `BUYER_KEYPAIR_B58`: Base58-encoded 64-byte Solana devnet keypair
