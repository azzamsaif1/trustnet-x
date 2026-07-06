# TrustNet X — Autonomous Underwriting Market for AI Agents

> **"Pricing Trust. Underwriting Agent Economies."**

TrustNet X adds an underwriting layer between bid and settlement in AI agent marketplaces. Instead of cheapest-bid-wins, a panel of 3 underwriter agents evaluates sellers through 7 deterministic engines, computing:

```
Real Cost = Bid + Risk Premium + Insurance Fee
```

**The cheapest bid is NOT the cheapest real cost.**

---

## 60-Second Quickstart

```bash
git clone https://github.com/azzamsaif1/trustnet-x.git
cd trustnet-x
npm install
npm run dev        # Dashboard opens at http://localhost:5173
```

Click **"Run TrustNet Demo"** → watch 7 engines fire, 3 underwriters deliberate, and the cheapest bid lose:

```
WANT → BID → AWARD → DEPOSITED → DELIVERED → VERIFIED → RELEASED
```

**CLI alternative:**
```bash
npm run demo       # Full demo in terminal (no browser needed)
npm test           # Run test suite (23 tests)
npm run build      # Production build
```

---

## Demo Flow

1. **WANT** — Buyer posts task: "Audit this smart contract for security and payment-splitting risks" (budget: 1 SOL)
2. **BID** — 3 sellers bid: CheapBot-9000 (0.20), PremiumAudit-Pro (0.50), SpeedReview-X (0.35)
3. **ENGINE** — Risk Engine, Fraud Engine, Underwriting Model, Insurance Engine fire in sequence
4. **AWARD** — 3 underwriters (Conservative, Aggressive, Fraud Specialist) deliberate → consensus
5. **SELECT** — Buyer picks PremiumAudit-Pro (real cost 0.51 SOL) over CheapBot-9000 (real cost 0.78 SOL)
6. **DEPOSITED** — Escrow locks funds (dynamic collateral based on risk class)
7. **DELIVERED** — PremiumAudit-Pro submits smart contract audit report
8. **VERIFIED** — Verifier checks 5-point quality gate (all pass)
9. **RELEASED** — Escrow releases on Solana devnet → Explorer link generated
10. **LEARN** — Adaptive learning updates trust scores post-transaction

**Key Result:** CheapBot-9000's 0.20 SOL bid inflates to 0.78 SOL after risk premium (+0.43) + insurance (+0.15). The cheapest bid **lost** because risk made it more expensive.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustNet X Dashboard                      │
│  React/Vite — BidTable, Timeline, WOW Moment, Settlement    │
│  Cost Inversion · Explainability · Adaptive Learning UI     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  deliverService() — CoralOS Pattern          │
│  BuyerRequest + SellerBids → UnderwritingReport              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              TrustNet Risk Agent (Orchestrator)               │
│  3 underwriters: Conservative · Aggressive · Fraud Specialist│
│  Confidence-weighted consensus with fraud veto power         │
└──┬─────┬─────┬─────┬─────┬─────┬─────┬─────────────────────┘
   │     │     │     │     │     │     │
   ▼     ▼     ▼     ▼     ▼     ▼     ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌──────────┐
│Risk ││Ins. ││Escrow││Rep. ││Fraud││Under││Explain-  │
│Eng. ││Eng. ││Policy││Eng. ││Eng. ││write││ability   │
│     ││     ││      ││     ││+Veto││Model││Engine    │
└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└──────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│         Adaptive Learning Engine (Before → After)            │
│  Trust score · Fraud probability · Insurance multiplier      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Solana Devnet Escrow Integration                 │
│  Real deposit/release with auto-fallback to simulation       │
│  Explorer URL: explorer.solana.com/tx/...?cluster=devnet     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Layer | Files | Purpose |
|-------|-------|---------|
| Types | `src/types/trustnet.ts` | Shared interfaces (BuyerRequest, SellerProfile, SellerBidReport, EscrowPolicy, etc.) |
| Config | `src/config/` | Seller personas, buyer profile, demo task |
| Engines | `src/engines/` | 7 deterministic engines: risk, insurance, escrow-policy, reputation, fraud, underwriting-model, adaptive-learning, explainability |
| Underwriters | `src/agents/underwriters/` | 3 personas: conservative, aggressive, fraud-specialist (with veto power) |
| Agents | `src/agents/` | Buyer, seller, trustnet-risk-agent, verifier |
| Service | `src/service/index.ts` | `deliverService()` — the CoralOS fork point |
| Solana | `src/solana/` | Devnet escrow (real + simulated fallback) + Explorer URL builder |
| Frontend | `src/ui/` | React components: Dashboard, BidTable, RiskReportCard, EscrowTimeline, SettlementProof + CSS animations |
| Tests | `src/tests/` | 23 tests covering core logic, adaptive learning, underwriting model, fraud intelligence, explainability |

---

## Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SETTLEMENT_MODE` | No | `simulated` (default) or `live` for real devnet transactions |
| `VITE_SOLANA_RPC_URL` | No | Devnet RPC (defaults to `https://api.devnet.solana.com`) |
| `VITE_WALLET_PATH` | No | Path to Solana keypair JSON (CLI context only) |
| `VITE_BUYER_KEYPAIR_B58` | No | Base58-encoded devnet keypair (works in browser + CLI) |
| `LLM_API_KEY` | No | Optional LLM key for natural-language reasoning |

**The demo runs with zero configuration.** All engines are deterministic — no API keys needed.

---

## 60-Second Demo Mode

```bash
npm install && npm run dev   # Dashboard at http://localhost:5173
```

Click **"Run TrustNet Demo"** — the full flow runs in simulated mode. No wallet, no devnet connection needed. Settlement is labeled `SIMULATED` with no Explorer link (no fake links).

---

## 5-Minute Live Devnet Setup

For real Solana devnet settlement with a valid Explorer proof link:

```bash
# 1. Generate a devnet wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# 2. Point to devnet
solana config set --url https://api.devnet.solana.com

# 3. Fund the wallet (2 SOL)
solana airdrop 2 $(solana address -k ~/.config/solana/devnet-wallet.json)

# 4. Convert keypair to Base58 for the browser
npx ts-node scripts/keypair-to-base58.ts ~/.config/solana/devnet-wallet.json

# 5. Create .env with live mode
cat > .env << 'EOF'
VITE_SETTLEMENT_MODE=live
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_BUYER_KEYPAIR_B58=<paste-base58-from-step-4>
EOF

# 6. Start the dashboard
npm run dev
```

**How to know live mode is working:** After the demo runs, the Settlement Proof section shows a green `LIVE DEVNET` badge with a clickable Explorer link pointing to a real transaction at `explorer.solana.com/tx/...?cluster=devnet`.

If live mode fails (insufficient balance, RPC timeout, etc.), it **automatically falls back** to simulated mode and shows the reason.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm run dev` port conflict | Vite auto-assigns next port (5174, 5175...) — check terminal output |
| Dashboard blank white screen | Check browser console for errors. Run `npx tsc --noEmit` to verify types |
| Airdrop failed / rate limit | Devnet faucet has rate limits. Wait a minute and retry, or use [faucet.solana.com](https://faucet.solana.com) |
| Wallet file missing | Run `solana-keygen new --outfile ~/.config/solana/devnet-wallet.json` |
| RPC timeout | Default RPC is `api.devnet.solana.com`. App auto-falls back to simulated mode |
| Simulated mode still active | Ensure `VITE_SETTLEMENT_MODE=live` is set in `.env` and restart dev server |
| `npm install` fails | Requires Node.js >= 20. Check with `node --version` |
| Tests fail | Run `npm test` — all 23 should pass. If not, ensure clean install |

---

## For Judges

**One-line pitch:** TrustNet X adds an underwriting layer to AI agent markets — the cheapest bid is NOT the cheapest real cost when risk is priced in.

**What to do:**
1. `npm install && npm run dev`
2. Click "Run TrustNet Demo" button
3. Watch 7 engines fire in real-time (risk → fraud → underwriting → panel)
4. See CheapBot-9000 (0.20 SOL bid) inflate to 0.78 SOL real cost (HIGH risk)
5. See SpeedReview-X (0.35 SOL bid) inflate to 0.56 SOL real cost (MEDIUM risk)
6. See PremiumAudit-Pro (0.50 SOL bid) stay at 0.51 SOL real cost (LOW risk)
7. Observe: buyer correctly picks PremiumAudit-Pro (lowest real cost)
8. Read the explainability panel — why cheap lost, why premium won
9. See adaptive learning: before/after trust score updates
10. Verification passes → escrow releases → Explorer link appears

**Why this is not another marketplace:** This is *infrastructure*. Seven deterministic engines price trust. Three underwriter personas form a panel with fraud veto power. An advanced underwriting model computes probability of failure, expected loss, confidence intervals, and dynamic collateral. Every decision is explainable. Zero LLM dependency. The formula `Real Cost = Bid + Risk Premium + Insurance Fee` is the product.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (dashboard) |
| `npm run demo` | Run CLI demo (terminal, no browser) |
| `npm test` | Run test suite (23 tests via Vitest) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type checking |
| `npx ts-node scripts/keypair-to-base58.ts <path>` | Convert Solana keypair JSON to Base58 |

---

## Submission Checklist

- [x] GitHub public repo
- [x] No secrets committed (`.env` gitignored, `.env.example` only)
- [x] `npm install` works
- [x] `npm run dev` works (dashboard loads)
- [x] `npm test` passes (23/23)
- [x] `npm run build` passes
- [x] Demo shows cost inversion (cheap bid → expensive real cost)
- [x] All 3 sellers ordered correctly: CheapBot > SpeedReview > PremiumAudit
- [x] Buyer selects premium_agent over cheap_agent
- [x] 7-step escrow flow reaches RELEASED
- [x] Solana Explorer devnet link (live mode only — no fake links in simulated mode)
- [x] 7 deterministic engines operational
- [x] 3 underwriter personas with fraud veto power
- [x] Adaptive learning with before/after visualization
- [x] Advanced underwriting model (P(failure), expected loss, risk classes)
- [x] Explainability engine (why cheap lost, why premium won, top factors)
- [x] Premium UI with animations and visual WOW moment
- [x] README with quickstart + architecture
- [x] `docs/pitch.md` (investor-grade, 5 slides)
- [x] `docs/demo-script.md` (3-minute script)
- [x] Zero LLM dependency for core logic
- [x] Built on Solana x CoralOS pattern

---

## Tech Stack

- **Runtime:** TypeScript, Node.js >= 20
- **Frontend:** React 18, Vite 5
- **Blockchain:** Solana devnet (@solana/web3.js)
- **Testing:** Vitest (23 tests)
- **Pattern:** CoralOS `deliverService()` fork point
- **UI:** Custom CSS animations, Inter + JetBrains Mono typography

---

*Built on [Solana x CoralOS](https://github.com/trilltino/solana_coralOS) | Devnet Only | 7 Engines | 3 Underwriters | Zero LLM*
