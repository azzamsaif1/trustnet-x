# TrustNet X — 3-Minute Demo Script

## 0:00–0:30 — The Problem (Hook)

> "Three AI agents bid on a security audit. The cheapest one costs 0.20 SOL. Would you hire it?
> It has a 40% no-show rate, 3 fraud signals, and 8 disputes. But in today's agent marketplaces,
> it would win — because nothing prices trust. That's a $2.1 trillion blind spot."

**[Show dashboard: buyer task posted, 3 sellers listed]**

---

## 0:30–1:15 — The Solution (TrustNet in action)

> "TrustNet X adds an underwriting layer. Click 'Run TrustNet Demo' and watch 7 engines fire."

**[Click demo button — show engine visualization]**

> "Watch the Risk Engine evaluate trust scores. The Fraud Engine detects anomalies — CheapBot
> triggers a fraud veto. The Underwriting Model computes probability of failure. Three
> underwriter personas deliberate and reach consensus."

**[Show bid table populating with trust scores, risk premiums, insurance fees]**

> "Now look at the costs:
> - CheapBot bid 0.20 SOL → Real cost **0.78 SOL** (HIGH risk, trust 26/100)
> - SpeedReview bid 0.35 SOL → Real cost **0.56 SOL** (MEDIUM risk, trust 56/100)  
> - PremiumAudit bid 0.50 SOL → Real cost **0.51 SOL** (LOW risk, trust 95/100)
>
> The cheapest bid just became the most expensive. That's underwriting."

**[Highlight the WOW moment: Cost Inversion visualization]**

---

## 1:15–2:00 — The Flow (Live escrow + intelligence)

> "The buyer selects PremiumAudit — lowest REAL cost. Now the 7-step escrow executes."

**[Show escrow timeline advancing: WANT → BID → AWARD → DEPOSITED → DELIVERED → VERIFIED → RELEASED]**

> "PremiumAudit delivers a thorough audit with 3 vulnerabilities found. The verifier checks
> 5 quality gates: risk summary, vulnerabilities, recommendations, confidence score, delivery hash.
> All pass. Verification triggers escrow release."

**[Show settlement proof with 5 green checks]**

> "Now watch the adaptive learning engine. CheapBot's trust drops from 25 to 5 after no-show.
> PremiumAudit's trust increases. The system learns from every transaction."

**[Show before/after learning snapshots]**

> "And here's the Solana devnet proof."

**[Show Explorer link — click to open]**

---

## 2:00–2:30 — Why This Matters (Architecture + Explainability)

> "This is NOT another marketplace. It's infrastructure. Seven deterministic engines.
> Three underwriter personas with a fraud specialist that has veto power.
> An advanced underwriting model computing probability of failure, expected loss,
> confidence intervals, and dynamic collateral requirements."

> "Every decision is explainable. The system tells you exactly why the cheap seller lost,
> why the premium seller won, the top 3 risk factors, and the escrow rationale."

**[Show explainability section]**

> "Zero LLM dependency. Pure deterministic underwriting. Built on Solana x CoralOS."

---

## 2:30–3:00 — Close (Vision + Call to action)

> "Every AI agent transaction needs trust infrastructure. As agent economies scale from
> thousands to millions of transactions, underwriting becomes the critical bottleneck.
>
> TrustNet X is the credit score, insurance, and escrow policy engine for autonomous economies.
> It's not just a hackathon project — it's category-defining infrastructure.
>
> Formula: Real Cost = Bid + Risk Premium + Insurance Fee.
>
> Try it now: `npm install && npm run dev`. The demo runs in 10 seconds, no API keys needed.
> 23 tests pass. Zero LLM dependency. Real Solana devnet settlement."

---

## Key Demo Commands

```bash
npm install          # Install dependencies
npm run dev          # Dashboard at localhost:5173
npm run demo         # CLI demo (terminal output)
npm test             # 23 tests (all pass)
npm run build        # Production build
```

## What Judges Should Look For

1. **Cost Inversion** — CheapBot's 0.20 bid inflates to 0.78 real cost
2. **7-Step Escrow** — Full state machine from WANT to RELEASED
3. **Live Engine Visualization** — Watch risk/fraud/underwriting engines fire in real-time
4. **Adaptive Learning** — Before/after trust score updates
5. **Fraud Veto** — CheapBot flagged by fraud specialist
6. **Explainability** — Every decision explained with top risk factors
7. **Solana Proof** — Explorer devnet link generated
8. **Premium UI** — Bloomberg Terminal / Stripe Risk feel
