# TrustNet X — Build Report

## What Was Built

A complete, working hackathon submission: **TrustNet X — Autonomous Underwriting Market for AI Agents**. The project adds an underwriting layer between bid and settlement in AI agent marketplaces, demonstrating that the cheapest bid is not always the cheapest real cost when risk is priced in.

### Core Innovation

```
Real Cost = Bid Price + Risk Premium + Insurance Fee
```

CheapBot-9000 (bid 0.20 SOL) → 0.78 SOL real cost (HIGH risk)
PremiumAudit-Pro (bid 0.50 SOL) → 0.51 SOL real cost (LOW risk)

The buyer correctly selects PremiumAudit-Pro — the cheapest bid **lost** because risk made it more expensive.

---

## Files Changed

### Source Code (39 files total)

| Category | Files | Purpose |
|----------|-------|---------|
| Types | `src/types/trustnet.ts` | Shared TypeScript interfaces |
| Config | `src/config/{sellers,buyer,demo-task}.ts` | Seller personas, buyer profile, demo task |
| Engines | `src/engines/{risk,insurance,escrow-policy,reputation,fraud}-engine.ts` | 5 deterministic risk engines |
| Underwriters | `src/agents/underwriters/{conservative,aggressive,fraud-specialist}.ts` | 3 underwriter personas |
| Agents | `src/agents/{buyer,seller,trustnet-risk-agent,verifier}.ts` | Agent logic |
| Service | `src/service/{index,demo}.ts` | Core service + CLI demo |
| Solana | `src/solana/{escrow,explorer}.ts` | Devnet integration |
| Frontend | `src/ui/{TrustNetDashboard,BidTable,RiskReportCard,EscrowTimeline,SettlementProof}.tsx` | React dashboard |
| Tests | `src/tests/trustnet.test.ts` | 12 unit tests |
| Entry | `src/main.tsx`, `index.html` | App entry point |
| Config | `package.json`, `tsconfig.json`, `vite.config.ts` | Build tooling |
| Docs | `README.md`, `docs/{pitch,demo-script,submission-checklist,-build-report}.md` | Documentation |
| Env | `.env.example`, `.gitignore` | Environment config |

---

## How to Run

### Dashboard (recommended)
```bash
npm install
npm run dev
# Open http://localhost:5173
# Click "Run TrustNet Demo"
```

### CLI Demo
```bash
npm run demo
```

### Tests
```bash
npm test          # 12 tests pass
npm run typecheck # Zero type errors
```

---

## Known Limitations

1. **Solana settlement is simulated by default** — real on-chain transactions require a funded devnet wallet (`BUYER_KEYPAIR_B58` in `.env`). The simulated mode generates a plausible transaction signature and Explorer URL.

2. **No real LLM integration in demo** — all engines are deterministic. An optional LLM key can be provided for natural-language reasoning text, but the core logic never depends on it.

3. **Reputation is in-memory** — reputation scores persist to localStorage in browser and reset on each CLI run. A production version would use a database.

4. **Single-node demo** — the full CoralOS multi-agent market (buyer/seller/verifier as separate processes communicating via MCP) is not demonstrated. The demo runs all agents in-process for reliability.

5. **No mainnet support** — devnet only. The Explorer URL always includes `?cluster=devnet`.

---

## What Is Real Devnet vs Demo Fallback

| Feature | Real Devnet Mode | Demo Fallback Mode |
|---------|-----------------|-------------------|
| **Activation** | Set `BUYER_KEYPAIR_B58` in `.env` | Default (no env vars needed) |
| **Transaction** | Real SOL transfer on devnet | Simulated signature generation |
| **Explorer Link** | Points to actual on-chain tx | Points to simulated tx (valid URL format) |
| **Label in UI** | `[DEVNET]` | `[SIMULATED]` + yellow banner |
| **Risk Engines** | Same deterministic logic | Same deterministic logic |
| **Underwriting** | Same 3-persona panel | Same 3-persona panel |

The **core logic is identical** in both modes. The only difference is whether the final escrow deposit/release is an actual Solana devnet transaction or a simulated one.

---

## Build Timeline

1. Studied CoralOS starter kit (service pattern, escrow flow, tooling)
2. Scaffolded project structure (39 files)
3. Implemented types, config, engines, underwriters, agents
4. Implemented `deliverService()` following CoralOS pattern
5. Added Solana devnet integration (escrow + explorer)
6. Built React dashboard (5 components)
7. Added one-click demo mode with live progress log
8. Added Judge Mode section
9. Added fallback mode with clear labelling
10. Wrote 12 unit tests
11. Polished README and documentation
12. Verified: `npm install`, `npm run dev`, `npm test`, `npm run demo` all pass

---

*Built on Solana x CoralOS*
