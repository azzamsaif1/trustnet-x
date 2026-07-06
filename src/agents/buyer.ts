import type { BuyerRequest, UnderwritingReport, SellerBidReport } from '../types/trustnet'

/**
 * Buyer agent: has budget + requirements.
 * Consumes the TrustNet underwriting report and selects the LOWEST REAL COST seller
 * (not the lowest bid). Must pick premium_agent over cheap_agent due to risk adjustment.
 */
export interface BuyerDecision {
  selectedSellerId: string
  selectedSellerName: string
  realCost: number
  reason: string
  withinBudget: boolean
}

export function buyerSelectSeller(
  request: BuyerRequest,
  report: UnderwritingReport
): BuyerDecision {
  // Sort by real cost (risk-adjusted), with risk-level tiebreaker
  const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 }
  const sorted = [...report.bids].sort((a, b) => {
    const costDiff = a.realCost - b.realCost
    // Within 0.03 SOL: prefer lower risk (the underwriting premium for safety)
    if (Math.abs(costDiff) <= 0.03) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
    }
    return costDiff
  })

  // Filter to within budget
  const affordable = sorted.filter(b => b.realCost <= request.budget)
  const selected: SellerBidReport = affordable.length > 0 ? affordable[0] : sorted[0]

  // Explain the decision
  const cheapestBid = [...report.bids].sort((a, b) => a.bid - b.bid)[0]
  const reason = selected.sellerId === cheapestBid.sellerId
    ? `Selected ${selected.sellerName} — both cheapest bid and lowest risk-adjusted cost.`
    : `Selected ${selected.sellerName} (real cost: ${selected.realCost} SOL) over ${cheapestBid.sellerName} (real cost: ${cheapestBid.realCost} SOL). The cheapest bid (${cheapestBid.bid} SOL) is NOT the cheapest real cost because risk premium (${cheapestBid.riskPremium} SOL) + insurance (${cheapestBid.insuranceFee} SOL) inflate it to ${cheapestBid.realCost} SOL.`

  return {
    selectedSellerId: selected.sellerId,
    selectedSellerName: selected.sellerName,
    realCost: selected.realCost,
    reason,
    withinBudget: selected.realCost <= request.budget,
  }
}
