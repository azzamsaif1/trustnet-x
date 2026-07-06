# TrustNet X — Test Plan

## What Changed
Complete new hackathon project: React dashboard showing autonomous underwriting market. The core claim is that risk-adjusted pricing inverts naive bid ordering — the cheapest bid becomes the most expensive real cost.

## Primary Flow: Dashboard End-to-End Demo

### Test 1: Dashboard loads and renders bid table with cost inversion

**Steps:**
1. Navigate to http://localhost:5174
2. Wait ~5 seconds for the demo animation to complete (7 states progress)

**Pass/Fail Criteria:**
- BidTable section is visible with heading "Seller Bids — Risk-Adjusted"
- Callout text reads exactly: "Cheapest bid lost because risk made it more expensive."
- CheapBot-9000 row shows:
  - Bid: 0.20
  - Risk Level: HIGH (red badge)
  - Real Cost > 0.70 SOL
  - Row has "CHEAPEST BID" danger badge
- PremiumAudit-Pro row shows:
  - Bid: 0.50
  - Risk Level: LOW (green badge)
  - Real Cost ~0.51 SOL
  - Row has "SELECTED" success badge
- PremiumAudit-Pro real cost < CheapBot-9000 real cost (the inversion)

### Test 2: Escrow timeline reaches RELEASED state

**Pass/Fail Criteria:**
- All 7 state labels visible: WANT, BID, AWARD, DEPOSITED, DELIVERED, VERIFIED, RELEASED
- All dots are green/completed (past state styling)
- RELEASED is the final active state

### Test 3: Settlement proof shows verification passed + Explorer link

**Pass/Fail Criteria:**
- "VERIFIED — RELEASE" status badge visible (green background)
- 5 check items all show checkmarks (✓):
  - Risk Summary ✓
  - Vulnerabilities ✓
  - Recommendation ✓
  - Confidence Score ✓
  - Delivery Hash ✓
- "View on Solana Explorer (devnet)" button/link present
- Link href contains "explorer.solana.com/tx/" and "?cluster=devnet"

### Test 4: Underwriting decision section shows correct recommendation

**Pass/Fail Criteria:**
- "Recommended Seller" shows "premium_agent"
- Reason text mentions CheapBot-9000's inflated cost
- Escrow Policy section shows deposit, verification level, deadline
- 3 underwriter opinions visible (Conservative, Aggressive, Fraud Specialist)

### Test 5 (CLI verification): npm run demo produces correct output

**Steps:** Run `npm run demo` in shell

**Pass/Fail Criteria:**
- Output contains "★ Recommended: premium_agent"
- Output contains "Buyer selects: PremiumAudit-Pro"
- CheapBot-9000 real cost > 0.70
- PremiumAudit-Pro real cost = 0.51
- Verification result: PASSED
- Explorer URL present with "?cluster=devnet"
